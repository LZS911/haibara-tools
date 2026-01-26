import { nanoid } from 'nanoid';
import { BaseRepository } from './base.repository';
import type {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRecord
} from '@/types/prompt-optimizer';
import path from 'path';

// 数据库行类型
interface OptimizationRow {
  id: string;
  timestamp: number;
  original_prompt: string;
  optimized_prompt: string;
  request: string;
  response: string;
  is_favorite: number;
}

/**
 * 提示词优化 Repository
 */
class PromptOptimizerRepositoryImpl extends BaseRepository {
  /**
   * 行数据转换为 OptimizationRecord
   */
  private rowToRecord(row: OptimizationRow): OptimizationRecord {
    return {
      id: row.id,
      timestamp: row.timestamp,
      originalPrompt: row.original_prompt,
      optimizedPrompt: row.optimized_prompt,
      request: JSON.parse(row.request) as OptimizationRequest,
      response: JSON.parse(row.response) as OptimizationResponse,
      isFavorite: row.is_favorite === 1
    };
  }

  /**
   * 保存优化记录
   */
  saveOptimization(
    request: OptimizationRequest,
    response: OptimizationResponse
  ): OptimizationRecord {
    const record: OptimizationRecord = {
      id: nanoid(),
      timestamp: Date.now(),
      originalPrompt: request.originalPrompt,
      optimizedPrompt: response.optimizedPrompt,
      request,
      response,
      isFavorite: false
    };

    this.db
      .prepare(
        `
      INSERT INTO prompt_optimizations 
      (id, timestamp, original_prompt, optimized_prompt, request, response, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        record.id,
        record.timestamp,
        record.originalPrompt,
        record.optimizedPrompt,
        JSON.stringify(record.request),
        JSON.stringify(record.response),
        0
      );

    return record;
  }

  /**
   * 获取所有历史记录
   */
  listHistory(): OptimizationRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM prompt_optimizations ORDER BY timestamp DESC')
      .all() as OptimizationRow[];
    return rows.map((row) => this.rowToRecord(row));
  }

  /**
   * 获取单个历史记录
   */
  getHistoryItem(id: string): OptimizationRecord | null {
    const row = this.db
      .prepare('SELECT * FROM prompt_optimizations WHERE id = ?')
      .get(id) as OptimizationRow | undefined;
    return row ? this.rowToRecord(row) : null;
  }

  /**
   * 删除历史记录
   */
  deleteHistoryItem(id: string): boolean {
    const result = this.db
      .prepare('DELETE FROM prompt_optimizations WHERE id = ?')
      .run(id);
    return result.changes > 0;
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(id: string): OptimizationRecord | null {
    const record = this.getHistoryItem(id);
    if (!record) {
      return null;
    }

    const newFavorite = !record.isFavorite;
    this.db
      .prepare('UPDATE prompt_optimizations SET is_favorite = ? WHERE id = ?')
      .run(newFavorite ? 1 : 0, id);

    return { ...record, isFavorite: newFavorite };
  }

  /**
   * 获取收藏列表
   */
  listFavorites(): OptimizationRecord[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM prompt_optimizations WHERE is_favorite = 1 ORDER BY timestamp DESC'
      )
      .all() as OptimizationRow[];
    return rows.map((row) => this.rowToRecord(row));
  }

  /**
   * 清空所有历史记录
   */
  clearHistory(): number {
    const result = this.db.prepare('DELETE FROM prompt_optimizations').run();
    return result.changes;
  }
}

// 导出单例实例
export const promptOptimizerRepository = new PromptOptimizerRepositoryImpl();

// 导出兼容的函数接口（注意：这些是同步版本，原来是异步）
export function saveOptimization(
  request: OptimizationRequest,
  response: OptimizationResponse
): Promise<OptimizationRecord> {
  return Promise.resolve(
    promptOptimizerRepository.saveOptimization(request, response)
  );
}

export function listHistory(): Promise<OptimizationRecord[]> {
  return Promise.resolve(promptOptimizerRepository.listHistory());
}

export function getHistoryItem(id: string): Promise<OptimizationRecord | null> {
  return Promise.resolve(promptOptimizerRepository.getHistoryItem(id));
}

export function deleteHistoryItem(id: string): Promise<boolean> {
  return Promise.resolve(promptOptimizerRepository.deleteHistoryItem(id));
}

export function toggleFavorite(id: string): Promise<OptimizationRecord | null> {
  return Promise.resolve(promptOptimizerRepository.toggleFavorite(id));
}

export function listFavorites(): Promise<OptimizationRecord[]> {
  return Promise.resolve(promptOptimizerRepository.listFavorites());
}

export function clearHistory(): Promise<number> {
  return Promise.resolve(promptOptimizerRepository.clearHistory());
}

// 保留原来的存储根目录获取函数（用于 JSON 迁移）
export function getPromptOptimizerRoot(): string {
  // 动态导入以避免循环依赖
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { getUserDataPath } = require('../../config') as {
    getUserDataPath: () => string | null;
  };
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'prompt-optimizer');
  }
  return path.join(process.cwd(), 'tmp', 'prompt-optimizer');
}
