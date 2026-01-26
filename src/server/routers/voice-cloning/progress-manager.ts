import { EventEmitter } from 'events';
import type { ProgressUpdate } from '@/types/voice-cloning';

/**
 * 进度管理器
 * 管理下载任务的进度状态
 */
export class ProgressManager extends EventEmitter {
  private static instance: ProgressManager;
  private progressMap: Map<string, ProgressUpdate>;

  private constructor() {
    super();
    this.progressMap = new Map();
  }

  static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  /**
   * 更新任务进度
   */
  updateProgress(update: ProgressUpdate): void {
    this.progressMap.set(update.jobId, update);
    this.emit('progress', update);
    console.log(
      `[Progress] ${update.jobId}: ${update.stage} - ${update.progress}%`,
      update.message || ''
    );
  }

  /**
   * 更新下载进度 (0-100%)
   */
  updateDownloadProgress(
    jobId: string,
    downloadPercent: number,
    message?: string
  ): void {
    const progress = Math.min(Math.round(downloadPercent), 100);
    this.updateProgress({
      jobId,
      stage: 'downloading',
      progress,
      message
    });
  }

  /**
   * 标记任务完成
   */
  markCompleted(jobId: string, message?: string): void {
    this.updateProgress({
      jobId,
      stage: 'completed',
      progress: 100,
      message
    });
  }

  /**
   * 标记任务出错
   */
  markError(jobId: string, error: string): void {
    this.updateProgress({
      jobId,
      stage: 'error',
      progress: 0,
      error
    });
  }

  /**
   * 获取任务当前进度
   */
  getProgress(jobId: string): ProgressUpdate | undefined {
    return this.progressMap.get(jobId);
  }

  /**
   * 清除任务进度记录
   */
  clearProgress(jobId: string): void {
    this.progressMap.delete(jobId);
  }

  /**
   * 订阅特定任务的进度更新
   */
  subscribeToJob(
    jobId: string,
    callback: (update: ProgressUpdate) => void
  ): () => void {
    const handler = (update: ProgressUpdate) => {
      if (update.jobId === jobId) {
        callback(update);
      }
    };

    this.on('progress', handler);

    // 返回取消订阅的函数
    return () => {
      this.off('progress', handler);
    };
  }
}

// 导出单例实例
export const progressManager = ProgressManager.getInstance();
