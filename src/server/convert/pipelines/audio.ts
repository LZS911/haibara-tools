import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'node:fs/promises';
import type { AudioFormat } from '../types';

// 设置 FFmpeg 和 FFprobe 路径
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * 音频格式转换函数
 */
export async function convertAudioFormat(
  inputPath: string,
  outputPath: string,
  _fromFormat: AudioFormat,
  toFormat: AudioFormat,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 验证输入文件是否存在
  try {
    await fs.access(inputPath);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    // 根据目标格式设置编码参数
    switch (toFormat) {
      case 'mp3':
        command
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .audioFrequency(44100);
        break;
      case 'wav':
        command.audioCodec('pcm_s16le').audioFrequency(44100);
        break;
      case 'aac':
        command.audioCodec('aac').audioBitrate('128k').audioFrequency(44100);
        break;
      case 'flac':
        command.audioCodec('flac').audioFrequency(44100);
        break;
      default:
        return reject(new Error(`Unsupported target format: ${toFormat}`));
    }

    // 设置输出文件
    command.output(outputPath);

    // 进度监听
    if (onProgress) {
      command.on('progress', (progress) => {
        if (progress.percent && !isNaN(progress.percent)) {
          onProgress(Math.round(progress.percent));
        }
      });
    }

    // 错误处理
    command.on('error', (err) => {
      reject(new Error(`Audio conversion failed: ${err.message}`));
    });

    // 完成处理
    command.on('end', () => {
      resolve();
    });

    // 开始转换
    command.run();
  });
}

/**
 * MP3 转 WAV
 */
export async function mp3ToWav(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'mp3', 'wav', onProgress);
}

/**
 * WAV 转 MP3
 */
export async function wavToMp3(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'wav', 'mp3', onProgress);
}

/**
 * MP3 转 AAC
 */
export async function mp3ToAac(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'mp3', 'aac', onProgress);
}

/**
 * AAC 转 MP3
 */
export async function aacToMp3(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'aac', 'mp3', onProgress);
}

/**
 * WAV 转 FLAC
 */
export async function wavToFlac(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'wav', 'flac', onProgress);
}

/**
 * FLAC 转 WAV
 */
export async function flacToWav(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertAudioFormat(inputPath, outputPath, 'flac', 'wav', onProgress);
}

/**
 * 获取音频文件信息
 */
export async function getAudioInfo(filePath: string): Promise<{
  duration?: number;
  format?: string;
  bitrate?: number;
  sampleRate?: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio info: ${err.message}`));
        return;
      }

      const audioStream = metadata.streams.find(
        (stream) => stream.codec_type === 'audio'
      );

      resolve({
        duration: metadata.format.duration,
        format: metadata.format.format_name,
        bitrate: metadata.format.bit_rate
          ? parseInt(String(metadata.format.bit_rate))
          : undefined,
        sampleRate: audioStream?.sample_rate
      });
    });
  });
}
