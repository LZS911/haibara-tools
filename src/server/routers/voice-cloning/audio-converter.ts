import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

/**
 * 将音频文件转换为指定格式
 * @param inputPath 输入音频文件路径
 * @param outputFormat 输出格式（如 'mp3', 'wav'）
 * @returns 转换后的文件路径
 */
export async function convertAudioFormat(
  inputPath: string,
  outputFormat: string = 'mp3'
): Promise<string> {
  const inputDir = path.dirname(inputPath);
  const inputBasename = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(inputDir, `${inputBasename}.${outputFormat}`);

  // 如果输出文件已存在，先删除
  try {
    await fs.unlink(outputPath);
  } catch {
    // 文件不存在，忽略
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(outputFormat)
      .audioCodec(outputFormat === 'wav' ? 'pcm_s16le' : 'libmp3lame')
      .audioBitrate('128k')
      .audioChannels(1) // 单声道
      .audioFrequency(16000) // 16kHz 采样率（适合语音）
      .on('end', () => {
        console.log(`Audio conversion completed: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Audio conversion failed: ${err.message}`);
        reject(new Error(`Failed to convert audio: ${err.message}`));
      })
      .save(outputPath);
  });
}

/**
 * 检查音频文件是否需要转换
 * @param filePath 音频文件路径
 * @returns 是否需要转换
 */
export function needsConversion(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const supportedFormats = ['.mp3', '.wav'];
  return !supportedFormats.includes(ext);
}

/**
 * 获取音频文件格式
 * @param filePath 音频文件路径
 * @returns 音频格式（不含点号）
 */
export function getAudioFormat(filePath: string): string {
  return path.extname(filePath).slice(1).toLowerCase();
}
