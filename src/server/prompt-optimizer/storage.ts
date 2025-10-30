import fs from 'fs/promises';
import path from 'path';
import { getUserDataPath } from '../lib/config';
import type {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRecord
} from '@/types/prompt-optimizer';
import { nanoid } from 'nanoid';

// 存储根目录
export function getPromptOptimizerRoot(): string {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'prompt-optimizer');
  }
  return path.join(process.cwd(), 'tmp', 'prompt-optimizer');
}

/**
 * 确保目录存在
 */
async function ensureDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * 获取历史记录目录路径
 */
function getHistoryDir(): string {
  return path.join(getPromptOptimizerRoot(), 'history');
}

/**
 * 获取历史记录文件路径
 */
function getHistoryFilePath(id: string): string {
  return path.join(getHistoryDir(), `${id}.json`);
}

/**
 * 保存优化记录
 */
export async function saveOptimization(
  request: OptimizationRequest,
  response: OptimizationResponse
): Promise<OptimizationRecord> {
  const historyDir = getHistoryDir();
  await ensureDirectory(historyDir);

  const record: OptimizationRecord = {
    id: nanoid(),
    timestamp: Date.now(),
    originalPrompt: request.originalPrompt,
    optimizedPrompt: response.optimizedPrompt,
    request,
    response,
    isFavorite: false
  };

  const filePath = getHistoryFilePath(record.id);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');

  return record;
}

/**
 * 获取所有历史记录
 */
export async function listHistory(): Promise<OptimizationRecord[]> {
  const historyDir = getHistoryDir();

  try {
    await fs.access(historyDir);
  } catch {
    return [];
  }

  try {
    const entries = await fs.readdir(historyDir);
    const recordPromises = entries
      .filter((entry) => entry.endsWith('.json'))
      .map(async (entry) => {
        try {
          const filePath = path.join(historyDir, entry);
          const content = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(content) as OptimizationRecord;
        } catch (error) {
          console.error(`Error reading history file ${entry}:`, error);
          return null;
        }
      });

    const records = (await Promise.all(recordPromises)).filter(
      (record): record is OptimizationRecord => record !== null
    );

    // 按时间戳降序排序
    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error listing history:', error);
    return [];
  }
}

/**
 * 获取单个历史记录
 */
export async function getHistoryItem(
  id: string
): Promise<OptimizationRecord | null> {
  try {
    const filePath = getHistoryFilePath(id);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as OptimizationRecord;
  } catch (error) {
    console.error(`Error reading history item ${id}:`, error);
    return null;
  }
}

/**
 * 删除历史记录
 */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  try {
    const filePath = getHistoryFilePath(id);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting history item ${id}:`, error);
    return false;
  }
}

/**
 * 切换收藏状态
 */
export async function toggleFavorite(
  id: string
): Promise<OptimizationRecord | null> {
  const record = await getHistoryItem(id);
  if (!record) {
    return null;
  }

  record.isFavorite = !record.isFavorite;

  try {
    const filePath = getHistoryFilePath(id);
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');
    return record;
  } catch (error) {
    console.error(`Error updating favorite status for ${id}:`, error);
    return null;
  }
}

/**
 * 获取收藏列表
 */
export async function listFavorites(): Promise<OptimizationRecord[]> {
  const allHistory = await listHistory();
  return allHistory.filter((record) => record.isFavorite);
}

/**
 * 清空所有历史记录
 */
export async function clearHistory(): Promise<number> {
  const historyDir = getHistoryDir();

  try {
    await fs.access(historyDir);
  } catch {
    return 0;
  }

  try {
    const entries = await fs.readdir(historyDir);
    let deletedCount = 0;

    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        try {
          await fs.unlink(path.join(historyDir, entry));
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting ${entry}:`, error);
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error clearing history:', error);
    return 0;
  }
}
