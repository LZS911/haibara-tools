import axios from 'axios';
import { promises as fs } from 'fs';
import type { Subtitle } from '@/types/bilibili';
import { UA } from './data/ua';
import { handleFilePath } from './utils';

/**
 * 格式化秒数为 SRT 时间戳格式 (HH:MM:SS,ms)
 */
const formatSrtTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round(
    (totalSeconds - Math.floor(totalSeconds)) * 1000
  );

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * 将B站字幕JSON数据转换为SRT格式字符串
 */
const convertJsonToSrt = (
  subtitleData: { from: number; to: number; content: string }[]
): string => {
  return subtitleData
    .map((item, index) => {
      const startTime = formatSrtTime(item.from);
      const endTime = formatSrtTime(item.to);
      return `${index + 1}\n${startTime} --> ${endTime}\n${item.content}\n`;
    })
    .join('\n');
};

/**
 * 获取并处理单个字幕文件
 */
const fetchAndProcessSubtitle = async (
  subtitleInfo: Subtitle,
  baseTitle: string,
  outputDir: string
) => {
  try {
    const response = await axios.get(`https:${subtitleInfo.url}`, {
      headers: { 'User-Agent': UA },
      responseType: 'json'
    });

    const subtitleJson = response.data.body;
    if (!Array.isArray(subtitleJson)) {
      console.error(`无效的字幕数据 (URL: ${subtitleInfo.url})`);
      return;
    }

    const srtContent = convertJsonToSrt(subtitleJson);

    // 构建文件名，如: [视频标题]-[简体中文].srt
    const srtFileName = `${baseTitle}-${subtitleInfo.title}`;
    const srtPath = handleFilePath(srtFileName, outputDir, '.srt');

    await fs.writeFile(srtPath, srtContent, 'utf-8');
    console.log(`Subtitle downloaded successfully: ${srtPath}`);
  } catch (error) {
    console.error(`下载字幕失败 (URL: ${subtitleInfo.url}):`, error);
  }
};

/**
 * 主入口：下载指定视频的所有可用字幕
 * @param baseTitle - 视频主标题 (不含P号标题)
 * @param outputDir - 文件输出目录
 * @param subtitleList - 从视频信息中获取的可用字幕列表
 */
export const downloadAllSubtitles = async (
  baseTitle: string,
  outputDir: string,
  subtitleList: Subtitle[]
) => {
  if (!subtitleList || subtitleList.length === 0) {
    console.warn('没有可用字幕');
    return; // 没有可用字幕
  }

  console.log(`发现 ${subtitleList.length} 条可用字幕，开始下载...`);

  const downloadPromises = subtitleList.map((subtitle) =>
    fetchAndProcessSubtitle(subtitle, baseTitle, outputDir)
  );

  await Promise.all(downloadPromises);
};
