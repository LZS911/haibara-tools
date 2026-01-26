import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { BaseRepository } from './base.repository';
import { getDownloadPath } from '../../config';

export interface DownloadHistoryItem {
  id: string;
  bvId: string;
  title: string;
  quality: number;
  videoPath?: string;
  audioPath?: string;
  mergedPath?: string;
  coverPath?: string;
  downloadedAt: number;
}

// 数据库行类型
interface DownloadHistoryRow {
  id: string;
  bv_id: string;
  title: string;
  quality: number;
  video_path: string | null;
  audio_path: string | null;
  merged_path: string | null;
  cover_path: string | null;
  downloaded_at: number;
}

/**
 * Bilibili 下载历史 Repository
 */
class BilibiliRepositoryImpl extends BaseRepository {
  /**
   * 行数据转换为 DownloadHistoryItem
   */
  private rowToItem(row: DownloadHistoryRow): DownloadHistoryItem {
    return {
      id: row.id,
      bvId: row.bv_id,
      title: row.title,
      quality: row.quality,
      videoPath: row.video_path ?? undefined,
      audioPath: row.audio_path ?? undefined,
      mergedPath: row.merged_path ?? undefined,
      coverPath: row.cover_path ?? undefined,
      downloadedAt: row.downloaded_at
    };
  }

  /**
   * 读取历史记录
   */
  readHistory(): DownloadHistoryItem[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM bilibili_download_history ORDER BY downloaded_at DESC'
      )
      .all() as DownloadHistoryRow[];
    return rows.map((row) => this.rowToItem(row));
  }

  /**
   * 写入历史记录（全量替换）
   */
  writeHistory(history: DownloadHistoryItem[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM bilibili_download_history').run();
      const insert = this.db.prepare(`
        INSERT INTO bilibili_download_history 
        (id, bv_id, title, quality, video_path, audio_path, merged_path, cover_path, downloaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of history) {
        insert.run(
          item.id,
          item.bvId,
          item.title,
          item.quality,
          item.videoPath ?? null,
          item.audioPath ?? null,
          item.mergedPath ?? null,
          item.coverPath ?? null,
          item.downloadedAt
        );
      }
    });
  }

  /**
   * 添加下载记录
   */
  addDownloadRecord(
    bvId: string,
    title: string,
    quality: number,
    videoPath?: string,
    audioPath?: string,
    mergedPath?: string,
    coverPath?: string
  ): DownloadHistoryItem {
    const now = Date.now();

    // 检查是否已存在
    const existing = this.db
      .prepare('SELECT * FROM bilibili_download_history WHERE bv_id = ?')
      .get(bvId) as DownloadHistoryRow | undefined;

    let record: DownloadHistoryItem;

    if (existing) {
      // 更新现有记录
      record = {
        id: existing.id,
        bvId,
        title,
        quality,
        videoPath,
        audioPath,
        mergedPath,
        coverPath,
        downloadedAt: now
      };

      this.db
        .prepare(
          `
        UPDATE bilibili_download_history 
        SET title = ?, quality = ?, video_path = ?, audio_path = ?, 
            merged_path = ?, cover_path = ?, downloaded_at = ?
        WHERE bv_id = ?
      `
        )
        .run(
          title,
          quality,
          videoPath ?? null,
          audioPath ?? null,
          mergedPath ?? null,
          coverPath ?? null,
          now,
          bvId
        );
    } else {
      // 创建新记录
      record = {
        id: nanoid(),
        bvId,
        title,
        quality,
        videoPath,
        audioPath,
        mergedPath,
        coverPath,
        downloadedAt: now
      };

      this.db
        .prepare(
          `
        INSERT INTO bilibili_download_history 
        (id, bv_id, title, quality, video_path, audio_path, merged_path, cover_path, downloaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          record.id,
          record.bvId,
          record.title,
          record.quality,
          record.videoPath ?? null,
          record.audioPath ?? null,
          record.mergedPath ?? null,
          record.coverPath ?? null,
          record.downloadedAt
        );

      // 限制历史记录数量，保留最近 500 条
      this.db
        .prepare(
          `
        DELETE FROM bilibili_download_history 
        WHERE id NOT IN (
          SELECT id FROM bilibili_download_history 
          ORDER BY downloaded_at DESC 
          LIMIT 500
        )
      `
        )
        .run();
    }

    return record;
  }

  /**
   * 获取下载历史（支持分页）
   */
  getDownloadHistory(
    page: number = 1,
    pageSize: number = 20
  ): { total: number; items: DownloadHistoryItem[] } {
    const totalRow = this.db
      .prepare('SELECT COUNT(*) as count FROM bilibili_download_history')
      .get() as { count: number };
    const total = totalRow.count;

    const offset = (page - 1) * pageSize;
    const rows = this.db
      .prepare(
        `
      SELECT * FROM bilibili_download_history 
      ORDER BY downloaded_at DESC 
      LIMIT ? OFFSET ?
    `
      )
      .all(pageSize, offset) as DownloadHistoryRow[];

    return {
      total,
      items: rows.map((row) => this.rowToItem(row))
    };
  }

  /**
   * 删除单条历史记录
   */
  deleteHistoryRecord(recordId: string): boolean {
    try {
      const record = this.db
        .prepare('SELECT * FROM bilibili_download_history WHERE id = ?')
        .get(recordId) as DownloadHistoryRow | undefined;

      if (!record) {
        return false;
      }

      // 获取视频所在目录
      const fileDir = record.merged_path
        ? path.dirname(record.merged_path)
        : record.video_path
          ? path.dirname(record.video_path)
          : null;

      if (fileDir && fs.existsSync(fileDir)) {
        const downloadPath = getDownloadPath();
        // 安全检查，确保要删除的目录在下载目录内
        if (path.resolve(fileDir).startsWith(path.resolve(downloadPath))) {
          fs.rmSync(fileDir, { recursive: true, force: true });
        } else {
          console.warn(
            `拒绝删除目录 ${fileDir}，因为它不在下载目录 ${downloadPath} 中。`
          );
        }
      } else {
        // 降级处理：如果无法确定目录，则只删除单个文件
        if (record.video_path && fs.existsSync(record.video_path)) {
          fs.unlinkSync(record.video_path);
        }
        if (record.audio_path && fs.existsSync(record.audio_path)) {
          fs.unlinkSync(record.audio_path);
        }
        if (record.merged_path && fs.existsSync(record.merged_path)) {
          fs.unlinkSync(record.merged_path);
        }
        if (record.cover_path && fs.existsSync(record.cover_path)) {
          fs.unlinkSync(record.cover_path);
        }
      }

      // 从数据库删除记录
      this.db
        .prepare('DELETE FROM bilibili_download_history WHERE id = ?')
        .run(recordId);
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  /**
   * 清空所有历史记录
   */
  clearHistory(): boolean {
    try {
      this.db.prepare('DELETE FROM bilibili_download_history').run();
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const bilibiliRepository = new BilibiliRepositoryImpl();

// 导出兼容的函数接口（使用箭头函数保持 this 绑定）
export const readHistory = () => bilibiliRepository.readHistory();
export const writeHistory = (history: DownloadHistoryItem[]) =>
  bilibiliRepository.writeHistory(history);
export const addDownloadRecord = (
  bvId: string,
  title: string,
  quality: number,
  videoPath?: string,
  audioPath?: string,
  mergedPath?: string,
  coverPath?: string
) =>
  bilibiliRepository.addDownloadRecord(
    bvId,
    title,
    quality,
    videoPath,
    audioPath,
    mergedPath,
    coverPath
  );
export const getDownloadHistory = (page?: number, pageSize?: number) =>
  bilibiliRepository.getDownloadHistory(page, pageSize);
export const deleteHistoryRecord = (recordId: string) =>
  bilibiliRepository.deleteHistoryRecord(recordId);
export const clearHistory = () => bilibiliRepository.clearHistory();
