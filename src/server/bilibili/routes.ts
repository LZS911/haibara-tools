import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import type { TRPCContext } from '../types';
import axios from 'axios';
import {
  checkUrl,
  checkUrlRedirect,
  parseHtml,
  getDownloadList,
  checkLogin
} from './core/bilibili';
import {
  LoginStatus,
  type SettingData,
  type VideoData
} from '@/types/bilibili';
import { downloadManager } from './download-manager';
import { getConfig, getDownloadPath } from '../lib/config';
import {
  getDownloadHistory,
  deleteHistoryRecord,
  clearHistory
} from './storage';
import { UA } from './core/data/ua';

const t = initTRPC.context<TRPCContext>().create();

// 从配置或环境变量构建设置
function buildSettings(
  isMerge: boolean = false,
  isDelete: boolean = false
): SettingData {
  const config = getConfig();
  return {
    downloadPath: getDownloadPath(),
    SESSDATA: config.BILIBILI_SESSDATA || '',
    bfeId: config.BILIBILI_BFE_ID || '',
    isMerge,
    isDelete,
    isSubtitle: config.BILIBILI_IS_SUBTITLE ?? false,
    isDanmaku: config.BILIBILI_IS_DANMAKU ?? false,
    isFolder: config.BILIBILI_IS_FOLDER ?? true,
    isCover: config.BILIBILI_IS_COVER ?? true,
    downloadingMaxSize: config.BILIBILI_DOWNLOADING_MAX_SIZE || 3
  };
}

export const bilibiliRouter = t.router({
  // 获取视频信息
  getVideoInfo: t.procedure
    .input(
      z.object({
        input: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const videoUrl = input.input.startsWith('http')
        ? input.input
        : `https://www.bilibili.com/video/${input.input}`;

      const settings = buildSettings();
      try {
        const urlType = checkUrl(videoUrl);
        if (!urlType) {
          throw new Error('Invalid Bilibili video URL');
        }

        const { body: html, url } = await checkUrlRedirect(videoUrl, settings);
        const videoInfo = await parseHtml(html, urlType, url, settings);
        console.log(videoInfo);
        if (videoInfo === -1 || !('page' in videoInfo)) {
          throw new Error('Failed to parse video information');
        }

        // 检查登录状态
        const loginStatus = await checkLogin(settings.SESSDATA);
        return {
          success: true,
          videoInfo: videoInfo as VideoData,
          loginStatus
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        throw new Error(`Failed to get video info: ${errorMessage}`);
      }
    }),

  // 下载视频
  downloadVideo: t.procedure
    .input(
      z.object({
        bvId: z.string(),
        videoUrl: z.url(),
        quality: z.number(),
        pages: z.array(z.number()),
        isMerge: z.boolean().default(false),
        isDelete: z.boolean().default(true)
      })
    )
    .mutation(async ({ input }) => {
      const { bvId, videoUrl, quality, pages, isMerge, isDelete } = input;

      const settings = buildSettings(isMerge, isDelete);

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

        // 获取下载列表
        const downloadList = await getDownloadList(
          videoInfo,
          pages,
          quality,
          settings
        );

        if (downloadList.length === 0) {
          throw new Error('No download list generated');
        }

        const taskIds = [];
        for (const videoData of downloadList) {
          const taskId = downloadManager.createTask(
            bvId,
            videoData.title,
            quality
          );

          // 异步开始下载（不等待完成）
          downloadManager
            .startDownload(taskId, videoData, settings)
            .catch((error) => {
              console.error(`Download failed for task ${taskId}:`, error);
            });
          taskIds.push(taskId);
        }

        return {
          success: true,
          taskIds
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        throw new Error(`Failed to download video: ${errorMessage}`);
      }
    }),

  // 订阅下载进度
  subscribeDownloadProgress: t.procedure
    .input(z.object({ taskId: z.string() }))
    .subscription(({ input }) => {
      return observable<{
        taskId: string;
        progress: number;
        status: string;
        totalSize?: number;
        downloadedSize?: number;
      }>((emit) => {
        const { taskId } = input;

        // 发送当前进度
        const currentTask = downloadManager.getTask(taskId);
        if (currentTask) {
          emit.next({
            taskId,
            progress: currentTask.progress,
            status: currentTask.status,
            totalSize: currentTask.totalSize,
            downloadedSize: currentTask.downloadedSize
          });
        }

        // 订阅进度更新
        const unsubscribe = downloadManager.subscribe(
          taskId,
          (id, progress, status, totalSize, downloadedSize) => {
            emit.next({
              taskId: id,
              progress,
              status,
              totalSize,
              downloadedSize
            });

            // 任务完成或失败时结束订阅
            if (
              status === 'completed' ||
              status === 'failed' ||
              status === 'cancelled'
            ) {
              setTimeout(() => {
                emit.complete();
              }, 1000);
            }
          }
        );

        return () => {
          unsubscribe();
        };
      });
    }),

  // 获取任务列表
  getDownloadTasks: t.procedure.query(() => {
    const tasks = downloadManager.getAllTasks();
    return tasks;
  }),

  // 获取单个任务
  getDownloadTask: t.procedure
    .input(z.object({ taskId: z.string() }))
    .query(({ input }) => {
      const task = downloadManager.getTask(input.taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    }),

  // 取消下载
  cancelDownload: t.procedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      await downloadManager.cancelTask(input.taskId);
      return { success: true };
    }),

  // 删除任务
  deleteTask: t.procedure
    .input(z.object({ taskId: z.string() }))
    .mutation(({ input }) => {
      const success = downloadManager.deleteTask(input.taskId);
      if (!success) {
        throw new Error('Cannot delete active download task');
      }
      return { success: true };
    }),

  // 检查登录状态
  checkLoginStatus: t.procedure
    .input(z.object({ SESSDATA: z.string() }))
    .query(async ({ input }) => {
      const loginStatus = await checkLogin(input.SESSDATA);
      return {
        loginStatus,
        statusText:
          loginStatus === LoginStatus.vip
            ? '大会员'
            : loginStatus === LoginStatus.user
              ? '普通用户'
              : '未登录'
      };
    }),

  // 获取下载历史
  getDownloadHistory: t.procedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(20)
      })
    )
    .query(({ input }) => {
      return getDownloadHistory(input.page, input.pageSize);
    }),

  // 删除历史记录
  deleteHistoryRecord: t.procedure
    .input(z.object({ recordId: z.string() }))
    .mutation(({ input }) => {
      const success = deleteHistoryRecord(input.recordId);
      if (!success) {
        throw new Error('Failed to delete history record');
      }
      return { success: true };
    }),

  // 清空历史记录
  clearHistory: t.procedure.mutation(() => {
    const success = clearHistory();
    if (!success) {
      throw new Error('Failed to clear history');
    }
    return { success: true };
  }),

  // 代理获取图片
  imageProxy: t.procedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      try {
        const response = await axios.get(input.url, {
          responseType: 'arraybuffer',
          // 添加 Referer 和 User-Agent 来模拟浏览器请求，绕过防盗链
          headers: {
            Referer: 'https://www.bilibili.com/',
            'User-Agent': UA
          }
        });

        const contentType = response.headers['content-type'];
        const base64 = Buffer.from(response.data, 'binary').toString('base64');

        return `data:${contentType};base64,${base64}`;
      } catch (error) {
        console.error('Failed to proxy image:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch image: ${error.message}`);
        }
        throw new Error('An unknown error occurred while fetching the image.');
      }
    })
});
