import { z } from 'zod';
import path from 'path';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import type { TRPCContext } from '../types';
import {
  checkUrl,
  checkUrlRedirect,
  parseHtml,
  getDownloadList
} from '../bilibili/core/bilibili';
import download from '../bilibili/core/download';
import type { SettingData } from '@/types/bilibili';
import { nanoid } from 'nanoid';
import fs from 'fs';
import fsp from 'fs/promises';
import { convertAudioFormat, needsConversion } from './audio-converter';
import { uploadAudioForTraining, getTrainingStatus } from './engine';
import { getConfig } from '../lib/config';
import { getTrainingRecordsPath, getVoiceCloningRoot } from './data';
import { progressManager } from './progress-manager';
import { synthesizeSpeech as ttsEngineSynthesize } from './tts-engine';
import {
  upsertTrainingRecord,
  listAllTrainings,
  deleteTrainingRecord
} from './storage';
import { TrainingStatusEnum, type ProgressUpdate } from '@/types/voice-cloning';

const t = initTRPC.context<TRPCContext>().create();

// 获取音色复刻任务存储目录

export const voiceCloningRouter = t.router({
  // 下载 B站视频音频
  downloadBvAudio: t.procedure
    .input(z.object({ bvIdOrUrl: z.string(), jobId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { bvIdOrUrl } = input;
      const jobId = input.jobId || nanoid();

      progressManager.updateDownloadProgress(jobId, 0, '开始下载音频');

      console.log(`开始下载 BV 号音频: ${bvIdOrUrl}`);
      const videoUrl = z.url().safeParse(bvIdOrUrl).success
        ? bvIdOrUrl
        : `https://www.bilibili.com/video/${bvIdOrUrl}`;

      const outputDir = path.join(getVoiceCloningRoot(), bvIdOrUrl);

      const config = getConfig();
      const settings: SettingData = {
        downloadPath: outputDir,
        SESSDATA: config.BILIBILI_SESSDATA || '',
        isMerge: false,
        isDelete: false,
        bfeId: config.BILIBILI_BFE_ID || '',
        isSubtitle: false,
        isDanmaku: false,
        isFolder: true,
        isCover: false,
        downloadingMaxSize: 1,
        audioOnly: true // 只下载音频
      };

      try {
        const urlType = checkUrl(videoUrl);
        if (!urlType) {
          throw new Error('无效的 Bilibili 视频 URL');
        }

        const { body: html, url } = await checkUrlRedirect(videoUrl, settings);
        const videoInfo = await parseHtml(html, urlType, url, settings);

        if (videoInfo === -1 || !('page' in videoInfo)) {
          throw new Error('解析视频信息失败');
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
          });
        });

        await Promise.all(downloadPromises);

        const downloadedTask = downloadList[0];
        const audioPath = downloadedTask.filePathList[3]; // 音频文件路径

        if (!fs.existsSync(audioPath)) {
          console.error(`下载失败: 未找到音频文件`);
          progressManager.markError(jobId, '下载失败: 未找到音频文件');
          return {
            success: false,
            audioPath: null,
            jobId
          };
        }

        // 检查音频格式，如需要则转换
        let finalAudioPath = audioPath;
        if (needsConversion(audioPath)) {
          console.log(`音频格式需要转换，正在转换为 mp3...`);
          finalAudioPath = await convertAudioFormat(audioPath, 'mp3');
          console.log(`音频转换完成: ${finalAudioPath}`);
        }

        progressManager.markCompleted(jobId, '音频下载完成');

        return {
          success: true,
          audioPath: finalAudioPath,
          title: videoInfo.title,
          jobId,
          fromCache: false
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`下载视频 ${bvIdOrUrl} 失败:`, error);
        progressManager.markError(jobId, errorMessage);
        throw new Error(`下载或处理视频失败: ${errorMessage}`);
      }
    }),

  // 启动音色训练
  startTraining: t.procedure
    .input(
      z.object({
        audioPath: z.string(),
        speakerId: z.string(),
        bvId: z.string(),
        title: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const { audioPath, speakerId, bvId, title } = input;

      if (!fs.existsSync(getTrainingRecordsPath())) {
        await fsp.writeFile(getTrainingRecordsPath(), JSON.stringify([]));
      }

      try {
        // 检查文件是否存在
        if (!fs.existsSync(audioPath)) {
          throw new Error('音频文件不存在');
        }

        // 保存训练记录
        await upsertTrainingRecord({
          speakerId,
          bvId,
          title,
          audioPath,
          status: TrainingStatusEnum.Training,
          createdAt: new Date().toISOString()
        });

        // 上传到火山引擎
        const status = await uploadAudioForTraining(audioPath, speakerId);

        // 更新训练记录状态
        await upsertTrainingRecord({
          speakerId,
          bvId,
          title,
          audioPath,
          status: status.status,
          createdAt: new Date().toISOString()
        });

        return {
          success: true,
          speakerId: speakerId,
          status: status.status,
          message: status.message
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`启动训练失败:`, error);

        // 更新为失败状态
        await upsertTrainingRecord({
          speakerId: input.speakerId,
          bvId: input.bvId,
          title: input.title,
          audioPath: input.audioPath,
          status: TrainingStatusEnum.Failed,
          createdAt: new Date().toISOString()
        });

        throw new Error(`启动训练失败: ${errorMessage}`);
      }
    }),

  // 查询训练状态
  getTrainingStatus: t.procedure
    .input(z.object({ speakerId: z.string() }))
    .query(async ({ input }) => {
      const { speakerId } = input;

      try {
        const status = await getTrainingStatus(speakerId);

        // 如果状态是成功或激活，更新训练记录
        if (
          status.status === TrainingStatusEnum.Success ||
          status.status === TrainingStatusEnum.Active
        ) {
          const record = await import('./storage').then((m) =>
            m.getTrainingRecord(speakerId)
          );
          if (record && record.status !== TrainingStatusEnum.Success) {
            await upsertTrainingRecord({
              ...record,
              status: TrainingStatusEnum.Success,
              completedAt: new Date().toISOString()
            });
          }
        }

        return status;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`查询训练状态失败:`, error);
        throw new Error(`查询训练状态失败: ${errorMessage}`);
      }
    }),

  // 获取所有训练列表
  listTrainings: t.procedure.query(async () => {
    try {
      const trainings = await listAllTrainings();
      return trainings;
    } catch (error) {
      console.error('获取训练列表失败:', error);
      return [];
    }
  }),

  // 删除训练记录
  deleteTraining: t.procedure
    .input(z.object({ speakerId: z.string() }))
    .mutation(async ({ input }) => {
      const { speakerId } = input;

      try {
        await deleteTrainingRecord(speakerId);
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`删除训练记录失败:`, error);
        throw new Error(`删除训练记录失败: ${errorMessage}`);
      }
    }),

  // 语音合成
  synthesizeSpeech: t.procedure
    .input(z.object({ text: z.string(), speakerId: z.string() }))
    .mutation(async ({ input }) => {
      const { text, speakerId } = input;

      try {
        const result = await ttsEngineSynthesize(text, speakerId);
        return {
          success: true,
          audioPath: result.audioPath,
          audioUrl: result.audioUrl
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        console.error(`语音合成失败:`, error);
        throw new Error(`语音合成失败: ${errorMessage}`);
      }
    }),

  // 订阅下载进度
  subscribeProgress: t.procedure
    .input(z.object({ jobId: z.string() }))
    .subscription(({ input }) => {
      return observable<ProgressUpdate>((emit) => {
        const { jobId } = input;

        // 立即发送当前进度（如果有）
        const currentProgress = progressManager.getProgress(jobId);
        if (currentProgress) {
          emit.next(currentProgress);
        }

        // 订阅进度更新
        const unsubscribe = progressManager.subscribeToJob(jobId, (update) => {
          emit.next(update);

          // 如果任务完成或出错，完成订阅
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
