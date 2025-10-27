import fs from 'fs/promises';
import path from 'path';
import type { Keyframe } from '@/types/media-to-docs';
import { getUserDataPath } from '../lib/config';

// 媒体文件缓存根目录
// 在 Electron 环境下使用 userData 目录，否则使用 process.cwd()
// 使用函数而不是常量，确保每次都能获取最新的环境变量

export function getMediaRoot(): string {
  // 优先使用用户配置的路径
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'media-to-docs-jobs');
  }
  return path.join(process.cwd(), 'tmp', 'media-to-docs-jobs');
}

interface Summary {
  id: string;
  createdAt: string;
  provider: string;
  style: string;
  content: string;
  keyframes?: Keyframe[];
}

/**
 * 检查指定 BV 号的视频是否已经下载并缓存
 */
export async function checkDownloadCache(bvId: string): Promise<{
  isCached: boolean;
  audioPath: string | null;
  title: string | null;
}> {
  try {
    const bvDir = path.join(getMediaRoot(), bvId);

    // 检查目录是否存在
    try {
      await fs.access(bvDir);
    } catch {
      return { isCached: false, audioPath: null, title: null };
    }

    // 查找音频文件
    const audioPath = await findAudioFile(bvDir);
    if (!audioPath) {
      return { isCached: false, audioPath: null, title: null };
    }

    // 尝试从目录名称提取标题
    const entries = await fs.readdir(bvDir);
    const videoDir = entries.find((entry) => entry.includes(bvId));
    const title = videoDir ? videoDir.split('-')[0] : null;

    return {
      isCached: true,
      audioPath,
      title
    };
  } catch (error) {
    console.error(`Error checking cache for ${bvId}:`, error);
    return { isCached: false, audioPath: null, title: null };
  }
}

/**
 * 在指定目录中递归查找音频文件
 */
export async function findAudioFile(dir: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 递归查找子目录
        const result = await findAudioFile(fullPath);
        if (result) return result;
      } else if (entry.isFile()) {
        // 检查是否是音频文件
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.m4s' && entry.name.includes('audio')) {
          return fullPath;
        }
        // 也支持其他常见音频格式
        if (['.mp3', '.wav', '.m4a', '.aac', '.flac'].includes(ext)) {
          return fullPath;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error finding audio file in ${dir}:`, error);
    return null;
  }
}

/**
 * 在指定目录中递归查找视频文件
 */
export async function findVideoFile(dir: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const result = await findVideoFile(fullPath);
        if (result) return result;
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
          return fullPath;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error finding video file in ${dir}:`, error);
    return null;
  }
}

/**
 * 获取所有缓存的列表
 */
export async function listAllCaches(): Promise<
  Array<{
    bvId: string;
    path: string;
    size: number;
    createdAt: Date;
    hasTranscript: boolean;
    title: string | null;
    audioPath: string | null;
    videoPath: string | null;
    summaries: Summary[];
  }>
> {
  const mediaRoot = getMediaRoot();
  try {
    await fs.access(mediaRoot);
  } catch {
    // 目录不存在，返回空数组
    return [];
  }

  const entries = await fs.readdir(mediaRoot, { withFileTypes: true });
  const cachePromises = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('BV'))
    .map(async (entry) => {
      const cachePath = path.join(mediaRoot, entry.name);
      try {
        const subEntries = await fs.readdir(cachePath, { withFileTypes: true });
        const contentDirEntry = subEntries.find((e) => e.isDirectory());

        if (!contentDirEntry) {
          return null; // Incomplete cache, skip
        }

        const contentPath = path.join(cachePath, contentDirEntry.name);

        const stats = await fs.stat(cachePath);
        const size = await getDirectorySize(cachePath);

        // 检查是否有转录缓存
        const transcriptPath = path.join(contentPath, 'transcript.txt');
        let hasTranscript = false;
        try {
          await fs.access(transcriptPath);
          hasTranscript = true;
        } catch {
          // transcript 不存在
        }

        // 读取所有摘要
        const summariesDir = path.join(contentPath, 'summaries');
        let summaries: Summary[] = [];
        try {
          const summaryFiles = await fs.readdir(summariesDir);
          const summaryPromises = summaryFiles
            .filter((file) => file.endsWith('.json'))
            .map(async (file) => {
              const summaryPath = path.join(summariesDir, file);
              const content = await fs.readFile(summaryPath, 'utf-8');
              return JSON.parse(content) as Summary;
            });
          summaries = await Promise.all(summaryPromises);
          // 按创建时间降序排序
          summaries.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } catch {
          // summaries 目录不存在或读取失败
        }

        // 获取标题和音频路径
        const { title, audioPath } = await checkDownloadCache(entry.name);
        // 获取视频路径
        const videoPath = await findVideoFile(cachePath);

        return {
          bvId: entry.name,
          path: cachePath,
          size,
          createdAt: stats.ctime,
          hasTranscript,
          title: title || entry.name,
          audioPath,
          videoPath,
          summaries
        };
      } catch (error) {
        console.error(`Error reading cache ${entry.name}:`, error);
        return null;
      }
    });

  const caches = (await Promise.all(cachePromises)).filter(
    (cache): cache is NonNullable<typeof cache> => cache !== null
  );

  return caches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * 计算目录大小
 */
async function getDirectorySize(dir: string): Promise<number> {
  let size = 0;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        size += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error calculating directory size for ${dir}:`, error);
  }

  return size;
}

/**
 * 删除指定的缓存
 */
export async function deleteCache(bvId: string): Promise<boolean> {
  try {
    const cachePath = path.join(getMediaRoot(), bvId);
    await fs.rm(cachePath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Error deleting cache ${bvId}:`, error);
    return false;
  }
}

/**
 * 清理过期的缓存（超过指定天数）
 */
export async function clearExpiredCaches(
  maxAgeDays: number = 7
): Promise<number> {
  const caches = await listAllCaches();
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const cache of caches) {
    const age = now - cache.createdAt.getTime();
    if (age > maxAgeMs) {
      const success = await deleteCache(cache.bvId);
      if (success) {
        deletedCount++;
      }
    }
  }

  return deletedCount;
}
