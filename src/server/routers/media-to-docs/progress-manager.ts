import { EventEmitter } from 'events';
import type { ProgressUpdate } from '@/types/media-to-docs';

/**
 * 进度管理器
 * 管理所有任务的进度状态，并通过事件发送进度更新
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
   * 更新下载进度 (0-25%)
   */
  updateDownloadProgress(
    jobId: string,
    downloadPercent: number,
    message?: string
  ): void {
    const progress = Math.min(Math.round(downloadPercent * 0.25), 25);
    this.updateProgress({
      jobId,
      stage: 'downloading',
      progress,
      message
    });
  }

  /**
   * 更新转录进度 (26-50%)
   */
  updateTranscriptionProgress(
    jobId: string,
    transcriptionPercent: number,
    message?: string
  ): void {
    const progress = Math.min(Math.round(26 + transcriptionPercent * 0.25), 50);
    this.updateProgress({
      jobId,
      stage: 'transcribing',
      progress,
      message
    });
  }

  /**
   * 更新关键帧提取进度 (51-65%)
   */
  updateKeyframeProgress(
    jobId: string,
    keyframePercent: number,
    message?: string
  ): void {
    const progress = Math.min(Math.round(51 + keyframePercent * 0.15), 65);
    this.updateProgress({
      jobId,
      stage: 'extracting-keyframes',
      progress,
      message
    });
  }

  /**
   * 更新 LLM 生成进度 (66-99%)
   */
  updateGenerationProgress(
    jobId: string,
    generationPercent: number,
    message?: string
  ): void {
    const progress = Math.min(Math.round(66 + generationPercent * 0.33), 99);
    this.updateProgress({
      jobId,
      stage: 'generating',
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
