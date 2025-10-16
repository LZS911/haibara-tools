import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { getUserDataPath, getDownloadPath } from '../lib/config';

// 获取历史记录文件路径
function getHistoryFilePath(): string {
  const baseDir = getUserDataPath();
  if (!baseDir) {
    return path.join(
      process.cwd(),
      'tmp',
      'bilibili-downloads',
      'bilibili-history.json'
    );
  }
  return path.join(baseDir, 'bilibili-downloads', 'bilibili-history.json');
}

// 确保目录存在
function ensureDirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

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

// 读取历史记录
export function readHistory(): DownloadHistoryItem[] {
  try {
    const historyPath = getHistoryFilePath();
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    const content = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(content) as DownloadHistoryItem[];
  } catch (error) {
    console.error('读取历史记录失败:', error);
    return [];
  }
}

// 写入历史记录
export function writeHistory(history: DownloadHistoryItem[]): void {
  try {
    const historyPath = getHistoryFilePath();
    const dir = path.dirname(historyPath);
    ensureDirSync(dir);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('写入历史记录失败:', error);
  }
}

// 添加下载记录
export function addDownloadRecord(
  bvId: string,
  title: string,
  quality: number,
  videoPath?: string,
  audioPath?: string,
  mergedPath?: string,
  coverPath?: string
): DownloadHistoryItem {
  const history = readHistory();
  const record: DownloadHistoryItem = {
    id: nanoid(),
    bvId,
    title,
    quality,
    videoPath,
    audioPath,
    mergedPath,
    coverPath,
    downloadedAt: Date.now()
  };

  // 添加到列表开头（最新的在前面）
  history.unshift(record);

  // 限制历史记录数量，保留最近 500 条
  if (history.length > 500) {
    history.splice(500);
  }

  writeHistory(history);
  return record;
}

// 获取下载历史（支持分页）
export function getDownloadHistory(
  page: number = 1,
  pageSize: number = 20
): { total: number; items: DownloadHistoryItem[] } {
  const history = readHistory();
  const total = history.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = history.slice(start, end);

  return { total, items };
}

// 删除单条历史记录
export function deleteHistoryRecord(recordId: string): boolean {
  try {
    const history = readHistory();
    const index = history.findIndex((item) => item.id === recordId);

    if (index === -1) {
      return false;
    }

    const record = history[index];

    // 获取视频所在目录
    const fileDir = record.mergedPath
      ? path.dirname(record.mergedPath)
      : record.videoPath
        ? path.dirname(record.videoPath)
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
      if (record.videoPath && fs.existsSync(record.videoPath)) {
        fs.unlinkSync(record.videoPath);
      }
      if (record.audioPath && fs.existsSync(record.audioPath)) {
        fs.unlinkSync(record.audioPath);
      }
      if (record.mergedPath && fs.existsSync(record.mergedPath)) {
        fs.unlinkSync(record.mergedPath);
      }
      if (record.coverPath && fs.existsSync(record.coverPath)) {
        fs.unlinkSync(record.coverPath);
      }
    }

    history.splice(index, 1);
    writeHistory(history);
    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
}

// 清空所有历史记录
export function clearHistory(): boolean {
  try {
    writeHistory([]);
    return true;
  } catch (error) {
    console.error('清空历史记录失败:', error);
    return false;
  }
}
