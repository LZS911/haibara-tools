import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import type { TaskData, SettingData } from '../../../types/bilibili';
import { mergeVideoAudio } from './media';
import { sleep } from './utils';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

export interface DownloadProgress {
  id: string;
  status: number;
  progress: number;
  totalSize: number;
  downloadedSize: number;
}

async function handleDeleteFile(setting: SettingData, videoInfo: TaskData) {
  // 删除原视频
  if (setting.isDelete) {
    const filePathList = videoInfo.filePathList;
    await fs.unlink(filePathList[2]);
    await fs.unlink(filePathList[3]);
  }
}

export default async (
  videoInfo: TaskData,
  setting: SettingData,
  progressCallback: (progress: DownloadProgress) => void
) => {
  const imageConfig = {
    headers: {
      'User-Agent': UA,
      cookie: `SESSDATA=${setting.SESSDATA}`
    },
    responseType: 'stream' as const
  };
  const downloadConfig = {
    headers: {
      'User-Agent': UA,
      referer: videoInfo.url
    },
    responseType: 'stream' as const
  };
  if (setting.isFolder) {
    // 创建文件夹
    try {
      await fs.mkdir(videoInfo.fileDir, { recursive: true });
    } catch (error) {
      console.error(`创建文件夹失败：${error}`);
    }
  }
  // 下载封面
  if (setting.isCover) {
    const writer = createWriteStream(videoInfo.filePathList[1]);
    const response = await axios.get(videoInfo.cover, imageConfig);
    response.data.pipe(writer);
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });
  }

  const videoResponse = await axios.get(videoInfo.downloadUrl.video, {
    ...downloadConfig,
    responseType: 'stream'
  });
  const audioResponse = await axios.get(videoInfo.downloadUrl.audio, {
    ...downloadConfig,
    responseType: 'stream'
  });

  const videoTotalLength = Number(videoResponse.headers['content-length'] || 0);
  const audioTotalLength = Number(audioResponse.headers['content-length'] || 0);
  const totalSize = videoTotalLength + audioTotalLength;

  let downloadedSize = 0;
  let lastUpdate = 0;

  const progressUpdate = (chunkLength: number, status: number) => {
    downloadedSize += chunkLength;
    const now = Date.now();
    if (now - lastUpdate > 1000 || downloadedSize === totalSize) {
      const progress = Math.round((downloadedSize / totalSize) * 100);
      progressCallback({
        id: videoInfo.id,
        status,
        progress,
        totalSize,
        downloadedSize
      });
      lastUpdate = now;
    }
  };

  // 下载视频
  const videoWriter = createWriteStream(videoInfo.filePathList[2]);
  videoResponse.data.on('data', (chunk: Buffer) => {
    progressUpdate(chunk.length, 1);
  });
  videoResponse.data.pipe(videoWriter);
  await new Promise<void>((resolve, reject) => {
    videoWriter.on('finish', resolve);
    videoWriter.on('error', reject);
  });

  await sleep(500);

  // 下载音频
  const audioWriter = createWriteStream(videoInfo.filePathList[3]);
  audioResponse.data.on('data', (chunk: Buffer) => {
    progressUpdate(chunk.length, 2);
  });
  audioResponse.data.pipe(audioWriter);
  await new Promise<void>((resolve, reject) => {
    audioWriter.on('finish', resolve);
    audioWriter.on('error', reject);
  });

  await sleep(500);

  // 合成视频
  if (setting.isMerge) {
    progressCallback({
      id: videoInfo.id,
      status: 3,
      progress: 99,
      totalSize,
      downloadedSize
    });
    try {
      await mergeVideoAudio(
        videoInfo.filePathList[2],
        videoInfo.filePathList[3],
        videoInfo.filePathList[0]
      );
      progressCallback({
        id: videoInfo.id,
        status: 0,
        progress: 100,
        totalSize,
        downloadedSize: totalSize
      });
      await handleDeleteFile(setting, videoInfo);
    } catch (error) {
      console.error(`音视频合成失败：${videoInfo.title} ${error}`);
      progressCallback({
        id: videoInfo.id,
        status: 5,
        progress: 100,
        totalSize,
        downloadedSize
      });
      await handleDeleteFile(setting, videoInfo);
    }
  } else {
    progressCallback({
      id: videoInfo.id,
      status: 0,
      progress: 100,
      totalSize,
      downloadedSize: totalSize
    });
    await handleDeleteFile(setting, videoInfo);
  }
};
