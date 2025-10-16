import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import type { SettingData, VideoData } from '../../types/bilibili';
import download, { type DownloadProgress } from './core/download';
import { addDownloadRecord } from './storage';

interface DownloadTask {
  id: string;
  bvId: string;
  title: string;
  quality: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  videoPath?: string;
  audioPath?: string;
  mergedPath?: string;
  coverPath?: string;
  createdAt: number;
  totalSize?: number;
  downloadedSize?: number;
}

type ProgressCallback = (
  taskId: string,
  progress: number,
  status: DownloadTask['status'],
  totalSize?: number,
  downloadedSize?: number
) => void;

class DownloadManager {
  private tasks: Map<string, DownloadTask> = new Map();
  private activeDownloads: Set<string> = new Set();
  private controllers: Map<string, AbortController> = new Map();
  private maxConcurrent = 3;
  private progressCallbacks: Map<string, ProgressCallback[]> = new Map();

  // 创建下载任务
  createTask(bvId: string, title: string, quality: number): string {
    const taskId = nanoid();
    const task: DownloadTask = {
      id: taskId,
      bvId,
      title,
      quality,
      status: 'pending',
      progress: 0,
      createdAt: Date.now()
    };
    this.tasks.set(taskId, task);
    return taskId;
  }

  // 启动下载
  async startDownload(
    taskId: string,
    videoData: VideoData,
    settings: SettingData
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    // 检查并发数限制
    while (this.activeDownloads.size >= this.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.activeDownloads.add(taskId);
    this.updateTaskStatus(taskId, 'downloading', 0);

    const controller = new AbortController();
    this.controllers.set(taskId, controller);

    task.videoPath = videoData.filePathList[2];
    task.audioPath = videoData.filePathList[3];
    task.coverPath = videoData.filePathList[1];
    if (settings.isMerge) {
      task.mergedPath = videoData.filePathList[0];
    }

    try {
      const taskData = {
        ...videoData,
        status: 0,
        progress: 0
      };

      await download(
        taskData,
        settings,
        (progress: DownloadProgress) => {
          this.updateTaskProgress(
            taskId,
            progress.progress,
            progress.totalSize,
            progress.downloadedSize
          );
        },
        controller.signal
      );

      this.updateTaskStatus(taskId, 'completed', 100);

      // 保存到历史记录
      addDownloadRecord(
        task.bvId,
        task.title,
        task.quality,
        task.videoPath,
        task.audioPath,
        task.mergedPath,
        task.coverPath
      );
    } catch (error) {
      if (controller.signal.aborted) {
        this.updateTaskStatus(taskId, 'cancelled', task.progress);
      } else {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        task.error = errorMessage;
        this.updateTaskStatus(taskId, 'failed', task.progress);
        throw error;
      }
    } finally {
      this.activeDownloads.delete(taskId);
      this.controllers.delete(taskId);
    }
  }

  // 取消下载
  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    const controller = this.controllers.get(taskId);

    if (task && controller && task.status === 'downloading') {
      controller.abort();
      this.updateTaskStatus(taskId, 'cancelled', task.progress);
      this.activeDownloads.delete(taskId);
      this.controllers.delete(taskId);

      // 等待一小段时间以确保文件句柄已释放
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const { videoPath, audioPath } = task;
        if (videoPath && (await fs.stat(videoPath).catch(() => false))) {
          await fs.unlink(videoPath);
        }
        if (audioPath && (await fs.stat(audioPath).catch(() => false))) {
          await fs.unlink(audioPath);
        }
      } catch (e) {
        console.error(`删除任务 ${taskId} 的文件失败`, e);
      }
    }
  }

  // 获取任务信息
  getTask(taskId: string): DownloadTask | undefined {
    return this.tasks.get(taskId);
  }

  // 获取所有任务
  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }

  // 删除任务
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status !== 'downloading') {
      this.tasks.delete(taskId);
      this.progressCallbacks.delete(taskId);
      return true;
    }
    return false;
  }

  // 订阅进度更新
  subscribe(taskId: string, callback: ProgressCallback): () => void {
    if (!this.progressCallbacks.has(taskId)) {
      this.progressCallbacks.set(taskId, []);
    }
    this.progressCallbacks.get(taskId)!.push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.progressCallbacks.get(taskId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // 更新任务进度
  private updateTaskProgress(
    taskId: string,
    progress: number,
    totalSize?: number,
    downloadedSize?: number
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = progress;
      task.totalSize = totalSize;
      task.downloadedSize = downloadedSize;
      this.notifyProgress(
        taskId,
        progress,
        task.status,
        totalSize,
        downloadedSize
      );
    }
  }

  // 更新任务状态
  private updateTaskStatus(
    taskId: string,
    status: DownloadTask['status'],
    progress?: number
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (progress !== undefined) {
        task.progress = progress;
      }
      this.notifyProgress(
        taskId,
        task.progress,
        status,
        task.totalSize,
        task.downloadedSize
      );
    }
  }

  // 通知订阅者
  private notifyProgress(
    taskId: string,
    progress: number,
    status: DownloadTask['status'],
    totalSize?: number,
    downloadedSize?: number
  ): void {
    const callbacks = this.progressCallbacks.get(taskId);
    if (callbacks) {
      callbacks.forEach((callback) =>
        callback(taskId, progress, status, totalSize, downloadedSize)
      );
    }
  }

  // 清理已完成和失败的任务（保留最近100个）
  cleanup(): void {
    const tasks = Array.from(this.tasks.values())
      .filter((t) => t.status === 'completed' || t.status === 'failed')
      .sort((a, b) => b.createdAt - a.createdAt);

    if (tasks.length > 100) {
      const toDelete = tasks.slice(100);
      toDelete.forEach((task) => this.tasks.delete(task.id));
    }
  }
}

export const downloadManager = new DownloadManager();
export type { DownloadTask };
