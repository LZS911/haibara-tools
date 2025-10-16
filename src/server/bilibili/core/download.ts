import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import * as http from 'http';
import * as https from 'https';
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
  progressCallback: (progress: DownloadProgress) => void,
  signal?: AbortSignal
) => {
  const httpAgent = new http.Agent({ keepAlive: false });
  const httpsAgent = new https.Agent({ keepAlive: false });

  const downloadHeaders = { 'User-Agent': UA, referer: videoInfo.url };

  // 1. 创建文件夹
  if (setting.isFolder) {
    try {
      await fs.mkdir(videoInfo.fileDir, { recursive: true });
    } catch (error) {
      // 忽略文件夹已存在的错误
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code !== 'EEXIST'
      ) {
        console.error(`创建文件夹失败：${error}`);
        throw error; // 抛出其他错误
      }
    }
  }

  // 2. 下载封面 (小文件，无需分块)
  if (setting.isCover) {
    const imageConfig = {
      headers: {
        'User-Agent': UA,
        cookie: `SESSDATA=${setting.SESSDATA}`
      },
      responseType: 'stream' as const,
      httpAgent,
      httpsAgent,
      signal
    };
    const writer = createWriteStream(videoInfo.filePathList[1]);
    const response = await axios.get(videoInfo.cover, imageConfig);
    response.data.pipe(writer);
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  // 3. 获取文件总大小
  const videoHead = await axios.head(videoInfo.downloadUrl.video, {
    headers: downloadHeaders,
    httpAgent,
    httpsAgent,
    signal
  });
  const audioHead = await axios.head(videoInfo.downloadUrl.audio, {
    headers: downloadHeaders,
    httpAgent,
    httpsAgent,
    signal
  });
  const videoTotalLength = Number(videoHead.headers['content-length'] || 0);
  const audioTotalLength = Number(audioHead.headers['content-length'] || 0);
  const totalSize = videoTotalLength + audioTotalLength;

  let downloadedSize = 0;
  let lastUpdate = 0;

  const overallProgressUpdate = (chunkLength: number, status: number) => {
    downloadedSize += chunkLength;
    const now = Date.now();
    if (now - lastUpdate > 1000 || downloadedSize === totalSize) {
      const progress =
        totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
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

  // 4. 定义分块下载函数
  const downloadInChunks = async (
    url: string,
    filePath: string,
    fileSize: number,
    status: number
  ) => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    const writer = createWriteStream(filePath);

    for (let start = 0; start < fileSize; start += CHUNK_SIZE) {
      if (signal?.aborted)
        throw new DOMException('Download aborted by user', 'AbortError');

      const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

      const response = await axios.get(url, {
        headers: { ...downloadHeaders, Range: `bytes=${start}-${end}` },
        responseType: 'stream',
        httpAgent,
        httpsAgent,
        signal
      });

      const streamPromise = new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          overallProgressUpdate(chunk.length, status);
        });
        response.data.pipe(writer, { end: false });
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

      await streamPromise;
    }
    writer.end();
  };

  // 5. 执行下载
  await downloadInChunks(
    videoInfo.downloadUrl.video,
    videoInfo.filePathList[2],
    videoTotalLength,
    1
  );
  await sleep(500);
  await downloadInChunks(
    videoInfo.downloadUrl.audio,
    videoInfo.filePathList[3],
    audioTotalLength,
    2
  );
  await sleep(500);

  // 6. 合成视频
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
