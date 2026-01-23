import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';
import { getVoiceCloningRoot } from './data';

// 检查指定 BV ID 的下载缓存
export async function checkDownloadCache(bvId: string) {
  try {
    const bvDir = path.join(getVoiceCloningRoot(), bvId);

    if (!fs.existsSync(bvDir)) {
      return { isCached: false, audioPath: null, title: null };
    }

    const audioPath = await findAudioFile(bvDir);

    if (!audioPath) {
      return { isCached: false, audioPath: null, title: null };
    }

    const entries = await fsp.readdir(bvDir);
    const audioDir = entries.find((entry) => entry.includes(bvId));
    const title = audioDir ? audioDir.split('-')[0] : null;

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

async function findAudioFile(dir: string): Promise<string | null> {
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 递归查找子目录
        const result = await findAudioFile(fullPath);
        if (result) return result;
      } else if (entry.isFile()) {
        // 检查是否是音频文件
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.mp3' && entry.name.includes('audio')) {
          return fullPath;
        }
        // 也支持其他常见音频格式
        if (['.wav', '.m4a', '.aac', '.flac'].includes(ext)) {
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
