import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'node:fs/promises';
import type { VideoFormat } from '../types';

const isPackaged = process.env.IS_PACKAGED === 'true';

// 设置 FFmpeg 和 FFprobe 路径
ffmpeg.setFfmpegPath(
  isPackaged
    ? ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked')
    : ffmpegInstaller.path
);
ffmpeg.setFfprobePath(
  isPackaged
    ? ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked')
    : ffprobeInstaller.path
);

/**
 * 视频格式转换函数
 */
export async function convertVideoFormat(
  inputPath: string,
  outputPath: string,
  _fromFormat: VideoFormat,
  toFormat: VideoFormat,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 验证输入文件是否存在
  try {
    await fs.access(inputPath);
  } catch (_error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    // 根据目标格式设置编码参数
    switch (toFormat) {
      case 'mp4':
        command
          .videoCodec('libx264')
          .audioCodec('aac')
          .addOption('-preset', 'medium')
          .addOption('-crf', '23') // 质量控制，23是良好的平衡点
          .format('mp4');
        break;
      case 'avi':
        command
          .videoCodec('libx264')
          .audioCodec('libmp3lame')
          .addOption('-preset', 'medium')
          .addOption('-crf', '23')
          .format('avi');
        break;
      case 'mov':
        command
          .videoCodec('libx264')
          .audioCodec('aac')
          .addOption('-preset', 'medium')
          .addOption('-crf', '23')
          .format('mov');
        break;
      case 'mkv':
        command
          .videoCodec('libx264')
          .audioCodec('aac')
          .addOption('-preset', 'medium')
          .addOption('-crf', '23')
          .format('matroska');
        break;
      case 'gif':
        // GIF 转换使用优化的两步法
        return videoToGif(inputPath, outputPath, {}, onProgress);
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
      reject(new Error(`Video conversion failed: ${err.message}`));
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
 * MP4 转其他格式
 */
export async function mp4ToFormat(
  inputPath: string,
  outputPath: string,
  toFormat: Exclude<VideoFormat, 'mp4'>,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertVideoFormat(inputPath, outputPath, 'mp4', toFormat, onProgress);
}

/**
 * AVI 转其他格式
 */
export async function aviToFormat(
  inputPath: string,
  outputPath: string,
  toFormat: Exclude<VideoFormat, 'avi'>,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertVideoFormat(inputPath, outputPath, 'avi', toFormat, onProgress);
}

/**
 * MOV 转其他格式
 */
export async function movToFormat(
  inputPath: string,
  outputPath: string,
  toFormat: Exclude<VideoFormat, 'mov'>,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertVideoFormat(inputPath, outputPath, 'mov', toFormat, onProgress);
}

/**
 * MKV 转其他格式
 */
export async function mkvToFormat(
  inputPath: string,
  outputPath: string,
  toFormat: Exclude<VideoFormat, 'mkv'>,
  onProgress?: (percent: number) => void
): Promise<void> {
  return convertVideoFormat(inputPath, outputPath, 'mkv', toFormat, onProgress);
}

/**
 * 优化的 GIF 转换 - 使用两步法生成高质量 GIF
 */
export async function videoToGif(
  inputPath: string,
  outputPath: string,
  options?: {
    startTime?: number; // 开始时间（秒）
    duration?: number; // 持续时间（秒）
    fps?: number; // 帧率
    width?: number; // 宽度
  },
  onProgress?: (percent: number) => void
): Promise<void> {
  const {
    startTime = 0,
    duration = 5, // 默认5秒
    fps = 10,
    width = 320
  } = options || {};

  // 生成临时调色板文件路径
  const paletteePath = outputPath.replace(/\.gif$/, '_palette.png');

  try {
    // 第一步：生成调色板
    await generatePalette(
      inputPath,
      paletteePath,
      {
        startTime,
        duration,
        fps,
        width
      },
      onProgress ? (percent) => onProgress(percent * 0.3) : undefined
    );

    // 第二步：使用调色板生成 GIF
    await generateGifWithPalette(
      inputPath,
      paletteePath,
      outputPath,
      {
        startTime,
        duration,
        fps,
        width
      },
      onProgress ? (percent) => onProgress(30 + percent * 0.7) : undefined
    );

    // 清理临时调色板文件
    try {
      await fs.unlink(paletteePath);
    } catch (_error) {
      // 忽略清理错误
    }
  } catch (error) {
    // 确保清理临时文件
    try {
      await fs.unlink(paletteePath);
    } catch (_error) {
      // 忽略清理错误
    }
    throw error;
  }
}

/**
 * 第一步：生成调色板
 */
async function generatePalette(
  inputPath: string,
  palettePath: string,
  options: {
    startTime: number;
    duration: number;
    fps: number;
    width: number;
  },
  onProgress?: (percent: number) => void
): Promise<void> {
  const { startTime, duration, fps, width } = options;

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    // 设置时间范围
    if (startTime > 0) {
      command.seekInput(startTime);
    }
    if (duration > 0) {
      command.duration(duration);
    }

    command
      .videoFilters([
        `fps=${fps}`,
        `scale=${width}:-1:flags=lanczos`,
        'palettegen=reserve_transparent=0:max_colors=256'
      ])
      .output(palettePath);

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
      reject(new Error(`Palette generation failed: ${err.message}`));
    });

    // 完成处理
    command.on('end', () => {
      resolve();
    });

    // 开始生成调色板
    command.run();
  });
}

/**
 * 第二步：使用调色板生成 GIF
 */
async function generateGifWithPalette(
  inputPath: string,
  palettePath: string,
  outputPath: string,
  options: {
    startTime: number;
    duration: number;
    fps: number;
    width: number;
  },
  onProgress?: (percent: number) => void
): Promise<void> {
  const { startTime, duration, fps, width } = options;

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    // 设置时间范围
    if (startTime > 0) {
      command.seekInput(startTime);
    }
    if (duration > 0) {
      command.duration(duration);
    }

    // 添加调色板作为第二个输入
    command.input(palettePath);

    // 使用复杂滤镜来合并视频和调色板
    command
      .complexFilter([
        `[0:v]fps=${fps},scale=${width}:-1:flags=lanczos[v]`,
        '[v][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
      ])
      .format('gif')
      .addOption('-loop', '0')
      .output(outputPath);

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
      reject(new Error(`GIF generation with palette failed: ${err.message}`));
    });

    // 完成处理
    command.on('end', () => {
      resolve();
    });

    // 开始生成 GIF
    command.run();
  });
}

/**
 * 获取视频文件信息
 */
export async function getVideoInfo(filePath: string): Promise<{
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video info: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === 'video'
      );

      resolve({
        duration: metadata.format.duration,
        format: metadata.format.format_name,
        width: videoStream?.width,
        height: videoStream?.height,
        bitrate: metadata.format.bit_rate
          ? parseInt(String(metadata.format.bit_rate))
          : undefined,
        fps: videoStream?.r_frame_rate
          ? eval(videoStream.r_frame_rate)
          : undefined
      });
    });
  });
}

/**
 * 压缩视频文件
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
  options?: {
    crf?: number; // 质量控制 (18-28, 越小质量越好)
    preset?: string; // 编码速度预设
    maxWidth?: number; // 最大宽度
  },
  onProgress?: (percent: number) => void
): Promise<void> {
  const { crf = 28, preset = 'medium', maxWidth = 1920 } = options || {};

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    command
      .videoCodec('libx264')
      .audioCodec('aac')
      .addOption('-preset', preset)
      .addOption('-crf', String(crf));

    // 如果需要缩放
    if (maxWidth) {
      command.videoFilters(`scale='min(${maxWidth},iw):-2'`);
    }

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
      reject(new Error(`Video compression failed: ${err.message}`));
    });

    // 完成处理
    command.on('end', () => {
      resolve();
    });

    // 开始转换
    command.run();
  });
}
