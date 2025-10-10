import fs from 'fs/promises';
import path from 'path';

// 媒体文件缓存根目录
export const MEDIA_ROOT = path.join(process.cwd(), 'tmp/media-to-docs-jobs');

/**
 * 检查指定 BV 号的视频是否已经下载并缓存
 */
export async function checkDownloadCache(bvId: string): Promise<{
  isCached: boolean;
  audioPath: string | null;
  title: string | null;
}> {
  try {
    const bvDir = path.join(MEDIA_ROOT, bvId);

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
 * 获取所有缓存的列表
 */
export async function listAllCaches(): Promise<
  Array<{
    bvId: string;
    path: string;
    size: number;
    createdAt: Date;
    hasTranscript: boolean;
  }>
> {
  try {
    await fs.access(MEDIA_ROOT);
  } catch {
    // 目录不存在，返回空数组
    return [];
  }

  const entries = await fs.readdir(MEDIA_ROOT, { withFileTypes: true });
  const caches: Array<{
    bvId: string;
    path: string;
    size: number;
    createdAt: Date;
    hasTranscript: boolean;
  }> = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('BV')) {
      const cachePath = path.join(MEDIA_ROOT, entry.name);
      try {
        const stats = await fs.stat(cachePath);
        const size = await getDirectorySize(cachePath);

        // 检查是否有转录缓存
        const transcriptPath = path.join(cachePath, 'transcript.txt');
        let hasTranscript = false;
        try {
          await fs.access(transcriptPath);
          hasTranscript = true;
        } catch {
          // transcript 不存在
        }

        caches.push({
          bvId: entry.name,
          path: cachePath,
          size,
          createdAt: stats.ctime,
          hasTranscript
        });
      } catch (error) {
        console.error(`Error reading cache ${entry.name}:`, error);
      }
    }
  }

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
    const cachePath = path.join(MEDIA_ROOT, bvId);
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
