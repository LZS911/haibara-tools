import { z } from 'zod';
import path from 'path';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import type { TRPCContext } from '../types';
import { transcribeAudioFile } from './pipelines/asr';
import * as fs from 'fs';
import fsp from 'fs/promises';
import {
  checkUrl,
  checkUrlRedirect,
  getDownloadList,
  parseHtml
} from '../bilibili/core/bilibili';
import download from '../bilibili/core/download';
import type { SettingData } from '../../types/bilibili';
import { checkModelAvailability } from '../llm/lib';
import {
  getMediaRoot,
  checkDownloadCache,
  listAllCaches,
  deleteCache,
  clearExpiredCaches
} from './cache';
import { progressManager } from './progress-manager';
import { nanoid } from 'nanoid';
import {
  SummaryStyleSchema,
  type ProgressUpdate,
  type Keyframe,
  KeyframeStrategySchema
} from '@/types/media-to-docs';
import { extractKeyframes } from './pipelines/keyframe';
import { LLM_PROVIDERS, VISION_PROVIDERS } from '../llm/providers';
import { KEYFRAME_STRATEGIES, STYLES } from './data';
import { LLMProviderSchema } from '@/types/llm';
import { getCompletionWithImages, getCompletion } from './pipelines/llm';

const t = initTRPC.context<TRPCContext>().create();

export const mediaToDocsRouter = t.router({
  downloadBvVideo: t.procedure
    .input(z.object({ bvId: z.string(), jobId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { bvId } = input;
      const jobId = input.jobId || nanoid();

      // 首先检查缓存
      const cachedResult = await checkDownloadCache(bvId);
      if (cachedResult.isCached && cachedResult.audioPath) {
        progressManager.updateDownloadProgress(
          jobId,
          100,
          '使用缓存的音频文件'
        );

        // 查找视频文件路径（尝试从同目录查找）
        const audioDir = path.dirname(cachedResult.audioPath);
        const files = await fsp.readdir(audioDir);
        const videoFile = files.find(
          (f) => f.endsWith('.mp4') && f.includes('video')
        );
        const videoPath = videoFile ? path.join(audioDir, videoFile) : null;

        return {
          success: true,
          title: cachedResult.title || bvId,
          audioPath: cachedResult.audioPath,
          videoPath,
          fromCache: true,
          jobId
        };
      }

      progressManager.updateDownloadProgress(jobId, 0, '开始下载视频');

      // 如果没有缓存，执行下载
      console.log(`No cache found for ${bvId}, downloading...`);
      const videoUrl = `https://www.bilibili.com/video/${bvId}`;
      const outputDir = path.join(getMediaRoot(), bvId);

      const settings: SettingData = {
        downloadPath: outputDir,
        SESSDATA: process.env.SESSDATA || '',
        isMerge: false,
        isDelete: false,
        bfeId: '',
        isSubtitle: false,
        isDanmaku: false,
        isFolder: true,
        isCover: false,
        downloadingMaxSize: 1
      };

      try {
        const urlType = checkUrl(videoUrl);
        if (!urlType) {
          throw new Error('Invalid Bilibili video URL');
        }

        const { body: html, url } = await checkUrlRedirect(videoUrl, settings);
        const videoInfo = await parseHtml(html, urlType, url, settings);

        if (videoInfo === -1 || !('page' in videoInfo)) {
          throw new Error('Failed to parse video information');
        }

        const downloadList = await getDownloadList(
          videoInfo,
          [videoInfo.page[0].page],
          videoInfo.qualityOptions[0].value,
          settings
        );

        // 转换 VideoData 为 TaskData
        const taskList = downloadList.map((video) => ({
          ...video,
          status: 0,
          progress: 0
        }));

        const downloadPromises = taskList.map((task) => {
          return download(task, settings, (progress) => {
            progressManager.updateDownloadProgress(
              jobId,
              progress.progress,
              `下载中: ${progress.progress}%`
            );
            console.log(
              `Download progress for ${task.id}: ${progress.progress}%`
            );
          });
        });

        await Promise.all(downloadPromises);

        const downloadedTask = downloadList[0];
        const audioPath = downloadedTask.filePathList[3]; // 音频文件路径
        const videoPath = downloadedTask.filePathList[2]; // 视频文件路径

        if (!fs.existsSync(audioPath)) {
          console.error(
            `download failed for ${bvId}:`,
            'not found downloaded audio file'
          );
          progressManager.markError(jobId, '下载失败：未找到音频文件');
          return {
            success: false,
            audioPath: null,
            videoPath: null,
            fromCache: false,
            jobId
          };
        }

        progressManager.updateDownloadProgress(jobId, 100, '下载完成');
        return {
          success: true,
          title: videoInfo.title,
          audioPath,
          videoPath: fs.existsSync(videoPath) ? videoPath : null,
          fromCache: false,
          jobId
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`Error downloading BV ID ${bvId}:`, error);
        progressManager.markError(jobId, `下载失败: ${errorMessage}`);
        throw new Error(
          `Failed to download or process video for BV ID: ${bvId}`
        );
      }
    }),
  summarize: t.procedure
    .input(
      z.object({
        audioPath: z.string(),
        videoPath: z.string().optional(),
        style: SummaryStyleSchema,
        provider: LLMProviderSchema,
        enableVision: z.boolean().optional().default(true),
        jobId: z.string().optional(),
        keyframeStrategy: KeyframeStrategySchema.optional().default(
          KEYFRAME_STRATEGIES[0].value
        ),
        keywords: z.string().optional(),
        forceAsr: z.boolean().optional().default(false),
        forceKeyframeGeneration: z.boolean().optional().default(false)
      })
    )
    .mutation(async ({ input }) => {
      const {
        audioPath,
        videoPath,
        style,
        provider,
        enableVision,
        keyframeStrategy,
        keywords,
        forceAsr,
        forceKeyframeGeneration
      } = input;
      const jobId = input.jobId || nanoid();

      try {
        if (!fs.existsSync(audioPath)) {
          progressManager.markError(jobId, '音频文件不存在');
          throw new Error('Audio file does not exist');
        }

        const outputDir = path.dirname(audioPath);

        // Check for cached transcript
        const transcriptPath = path.join(outputDir, 'transcript.txt');
        const utterancesPath = path.join(outputDir, 'utterances.json');
        let fullText: string;
        let utterances: Array<{
          text: string;
          start_time: number;
          end_time: number;
        }> = [];

        if (fs.existsSync(transcriptPath) && !forceAsr) {
          console.log('Found cached transcript, skipping ASR.');
          progressManager.updateTranscriptionProgress(
            jobId,
            100,
            '使用缓存的转录结果'
          );
          fullText = await fsp.readFile(transcriptPath, 'utf-8');

          // 读取 utterances（如果存在）
          if (fs.existsSync(utterancesPath)) {
            const utterancesData = await fsp.readFile(utterancesPath, 'utf-8');
            utterances = JSON.parse(utterancesData);
          }
        } else {
          if (forceAsr) {
            console.log('Force ASR is enabled, running ASR...');
          } else {
            console.log('No cached transcript found, running ASR...');
          }
          progressManager.updateTranscriptionProgress(jobId, 0, '开始语音识别');
          const asrResult = await transcribeAudioFile(audioPath, jobId);
          fullText = asrResult.fullText;
          utterances = asrResult.utterances;
          progressManager.updateTranscriptionProgress(
            jobId,
            100,
            '语音识别完成'
          );
        }

        const modelAvailability = await checkModelAvailability(provider);
        if (!modelAvailability) {
          progressManager.markError(jobId, `LLM 提供商 ${provider} 不可用`);
          throw new Error(
            `The selected LLM provider (${provider}) is not available. Please check your API key and configuration.`
          );
        }

        let keyframes: Keyframe[] = [];
        let summarizedContent: string;

        // 如果启用视觉模式且有视频文件
        const useVision =
          enableVision &&
          videoPath &&
          fs.existsSync(videoPath) &&
          VISION_PROVIDERS.includes(provider);

        if (useVision && videoPath) {
          // 提取关键帧
          const keyframesPath = path.join(
            outputDir,
            `keyframes-${keyframeStrategy}.json`
          );

          if (fs.existsSync(keyframesPath) && !forceKeyframeGeneration) {
            //使用缓存的关键帧
            progressManager.updateKeyframeProgress(
              jobId,
              100,
              '使用缓存的关键帧'
            );
            const keyframesData = await fsp.readFile(keyframesPath, 'utf-8');
            keyframes = JSON.parse(keyframesData);
          } else {
            if (forceKeyframeGeneration) {
              console.log(
                'Force keyframe generation is enabled, extracting new keyframes...'
              );
            } else {
              console.log(
                'No cached keyframes found, extracting new keyframes...'
              );
            }
            // 提取新的关键帧
            console.log(
              `Extracting new keyframes with strategy: ${keyframeStrategy}`
            );
            progressManager.updateKeyframeProgress(jobId, 0, '开始提取关键帧');
            keyframes = await extractKeyframes(
              videoPath,
              utterances,
              outputDir,
              keyframeStrategy,
              jobId,
              keywords
            );
            await fsp.writeFile(
              keyframesPath,
              JSON.stringify(keyframes, null, 2)
            );
            console.log('Saved new keyframes and meta data.');
          }

          // 如果是关键字策略，则只使用与关键字相关的文本
          const textForLLM =
            keyframeStrategy === 'keyword'
              ? keyframes.map((kf) => kf.text).join('\n')
              : fullText;

          // 使用多模态 LLM
          console.log('Generating content with vision...');
          progressManager.updateGenerationProgress(
            jobId,
            0,
            '开始生成图文文档'
          );
          summarizedContent = await getCompletionWithImages(
            textForLLM,
            keyframes,
            provider,
            jobId
          );
        } else {
          // 传统文本 LLM
          console.log('Generating content without vision...');
          progressManager.updateGenerationProgress(jobId, 0, '开始生成文档');
          summarizedContent = await getCompletion(
            fullText,
            style,
            provider,
            jobId
          );
        }

        progressManager.markCompleted(jobId, '文档生成完成');

        // 保存生成的内容到带元数据的 JSON 文件中
        const summariesDir = path.join(outputDir, 'summaries');
        await fsp.mkdir(summariesDir, { recursive: true });
        const summaryId = nanoid();
        const summaryData = {
          id: summaryId,
          createdAt: new Date().toISOString(),
          provider,
          style,
          content: summarizedContent,
          keyframes: keyframes.map((kf) => ({
            ...kf,
            // 转换服务端路径为前端可访问 URL
            imageUrl: kf.imagePath.includes('media-to-docs-jobs')
              ? `/media-files/${kf.imagePath.split('media-to-docs-jobs/')[1]}`
              : undefined
          }))
        };
        const summaryPath = path.join(summariesDir, `${summaryId}.json`);
        await fsp.writeFile(summaryPath, JSON.stringify(summaryData, null, 2));

        const result = {
          originalText: fullText,
          summarizedContent: summarizedContent,
          keyframes: keyframes.map((kf) => ({
            ...kf,
            // 转换服务端路径为前端可访问 URL
            imageUrl: kf.imagePath.includes('media-to-docs-jobs')
              ? `/media-files/${kf.imagePath.split('media-to-docs-jobs/')[1]}`
              : undefined
          })),
          jobId
        };

        console.log('📦 Returning result:', {
          hasKeyframes: result.keyframes.length > 0,
          keyframesCount: result.keyframes.length,
          contentLength: result.summarizedContent.length,
          sampleKeyframe: result.keyframes[0]
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        progressManager.markError(jobId, errorMessage);
        throw error;
      }
    }),

  getOptionsData: t.procedure.query(async () => {
    const availabilityPromises = LLM_PROVIDERS.map(async (provider) => {
      const isAvailable = await checkModelAvailability(provider.id);
      return {
        id: provider.id,
        status: isAvailable ? 'success' : 'error'
      };
    });

    const availabilityResults = await Promise.all(availabilityPromises);

    const providerStatuses = availabilityResults.reduce(
      (acc, result) => {
        acc[result.id] = result.status as 'success' | 'error';
        return acc;
      },
      {} as Record<string, 'success' | 'error'>
    );

    return {
      styles: STYLES,
      providers: LLM_PROVIDERS,
      providerStatuses,
      keyframeStrategies: KEYFRAME_STRATEGIES
    };
  }),
  // 缓存管理 API
  listCaches: t.procedure.query(async () => {
    const caches = await listAllCaches();
    return caches;
  }),
  deleteCache: t.procedure
    .input(z.object({ bvId: z.string() }))
    .mutation(async ({ input }) => {
      const { bvId } = input;
      const success = await deleteCache(bvId);
      return { success };
    }),
  clearExpiredCaches: t.procedure
    .input(z.object({ maxAgeDays: z.number().optional().default(7) }))
    .mutation(async ({ input }) => {
      const { maxAgeDays } = input;
      const deletedCount = await clearExpiredCaches(maxAgeDays);
      return { deletedCount };
    }),
  // 进度订阅
  subscribeProgress: t.procedure
    .input(z.object({ jobId: z.string() }))
    .subscription(({ input }) => {
      return observable<ProgressUpdate>((emit) => {
        const { jobId } = input;

        // 发送当前进度（如果有）
        const currentProgress = progressManager.getProgress(jobId);
        if (currentProgress) {
          emit.next(currentProgress);
        }

        // 订阅进度更新
        const unsubscribe = progressManager.subscribeToJob(jobId, (update) => {
          emit.next(update);

          // 如果任务完成或出错，结束订阅
          if (update.stage === 'completed' || update.stage === 'error') {
            setTimeout(() => {
              emit.complete();
            }, 1000); // 延迟 1 秒后完成，确保前端收到最后的更新
          }
        });

        // 返回清理函数
        return () => {
          unsubscribe();
        };
      });
    })
});
