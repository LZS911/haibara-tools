import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { progressManager } from '../progress-manager';
import type { KeyframeStrategy } from '@/types/media-to-docs';

const execAsync = promisify(exec);

const isPackaged = process.env.IS_PACKAGED === 'true';

const ffmpegPath = isPackaged
  ? ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked')
  : ffmpegInstaller.path;

const ffprobePath = isPackaged
  ? ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked')
  : ffprobeInstaller.path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const ffprobeAsync = promisify(ffmpeg.ffprobe);

export interface AsrUtterance {
  text: string;
  start_time: number; // 毫秒
  end_time: number; // 毫秒
}

export interface Keyframe {
  timestamp: number; // 秒
  imagePath: string; // 服务端路径
  text: string; // 该时间段对应的文字
}

// --- Utility Functions ---

/**
 * 调整时间戳数组的数量以匹配目标数量
 * @param timestamps - 原始时间戳数组
 * @param targetCount - 目标数量
 * @param duration - 视频总时长（用于补充）
 * @returns 调整后的时间戳数组
 */
function adjustTimestampsCount(
  timestamps: number[],
  targetCount: number,
  duration: number
): number[] {
  let adjustedTimestamps = Array.from(new Set(timestamps)).sort(
    (a, b) => a - b
  );

  // 如果数量不足，通过均匀分布补充
  if (adjustedTimestamps.length < targetCount) {
    const missing = targetCount - adjustedTimestamps.length;
    const interval = duration / (missing + 1);
    const existingTimestampsSet = new Set(adjustedTimestamps);
    const additionalTimestamps: number[] = [];

    for (let i = 1; i <= missing; i++) {
      const newTimestamp = Math.round(i * interval);
      // 避免添加太接近的帧
      if (
        !existingTimestampsSet.has(newTimestamp) &&
        !adjustedTimestamps.some((ts) => Math.abs(ts - newTimestamp) < 2)
      ) {
        additionalTimestamps.push(newTimestamp);
      }
    }
    adjustedTimestamps = [...adjustedTimestamps, ...additionalTimestamps].sort(
      (a, b) => a - b
    );
  }

  // 如果数量过多，进行均匀抽样
  if (adjustedTimestamps.length > targetCount) {
    const step = adjustedTimestamps.length / targetCount;
    adjustedTimestamps = Array.from(
      { length: targetCount },
      (_, i) => adjustedTimestamps[Math.floor(i * step)]
    );
  }

  return Array.from(new Set(adjustedTimestamps)).sort((a, b) => a - b);
}

/**
 * 获取视频时长（秒）
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const metadata = (await ffprobeAsync(videoPath)) as {
    format: { duration?: number };
  };
  return metadata.format.duration || 0;
}

// --- Strategy Implementations ---

/**
 * 策略 1: 均匀分布
 */
function getUniformTimestamps(
  targetFrameCount: number,
  duration: number
): number[] {
  const interval = duration / (targetFrameCount + 1);
  return Array.from({ length: targetFrameCount }, (_, i) =>
    Math.round((i + 1) * interval)
  );
}

/**
 * 策略 2: 基于 ASR 语义分段
 */
function getSemanticTimestamps(
  utterances: AsrUtterance[],
  duration: number,
  targetFrameCount: number
): number[] {
  const validUtterances = utterances.filter(
    (utt) => utt.start_time >= 0 && utt.end_time >= 0
  );

  if (validUtterances.length === 0) {
    return getUniformTimestamps(targetFrameCount, duration);
  }

  const segments: { start: number; end: number }[] = [];
  let currentSegmentStart = validUtterances[0].start_time / 1000;
  const segmentDuration = Math.max(
    20,
    Math.min(40, duration / targetFrameCount)
  );

  for (let i = 0; i < validUtterances.length; i++) {
    const utt = validUtterances[i];
    const uttEndTime = utt.end_time / 1000;

    const shouldEndSegment =
      i === validUtterances.length - 1 ||
      uttEndTime - currentSegmentStart >= segmentDuration;

    if (shouldEndSegment) {
      segments.push({
        start: currentSegmentStart,
        end: uttEndTime
      });
      if (i < validUtterances.length - 1) {
        currentSegmentStart = validUtterances[i + 1].start_time / 1000;
      }
    }
  }

  const semanticTimestamps = segments.map((seg) =>
    Math.round((seg.start + seg.end) / 2)
  );

  return adjustTimestampsCount(semanticTimestamps, targetFrameCount, duration);
}

/**
 * 策略 3: 基于视觉变化的场景检测
 * @param sensitivity - 场景检测灵敏度 (0.1 - 1.0)
 */
async function getVisualTimestamps(
  videoPath: string,
  duration: number,
  targetFrameCount: number,
  sensitivity = 0.4
): Promise<number[]> {
  console.log(`Starting scene detection for ${videoPath}`);
  const command = `"${ffmpegPath}" -i "${videoPath}" -filter:v "select='gt(scene,${sensitivity})',metadata=print" -f null -`;

  try {
    const { stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10
    }); // 10MB buffer
    const sceneChangeLines = stderr.match(/pts_time:([0-9.]+)/g) || [];
    const visualTimestamps = sceneChangeLines.map((line) =>
      parseFloat(line.split(':')[1])
    );

    console.log(`Detected ${visualTimestamps.length} potential scene changes.`);
    return adjustTimestampsCount(visualTimestamps, targetFrameCount, duration);
  } catch (error) {
    console.error('Error during scene detection:', error);
    // 如果场景检测失败，回退到均匀分布
    return getUniformTimestamps(targetFrameCount, duration);
  }
}

/**
 * 计算关键帧提取时间点
 */
async function calculateKeyframeTimestamps(
  utterances: AsrUtterance[],
  duration: number,
  strategy: KeyframeStrategy,
  videoPath: string
): Promise<number[]> {
  const durationMinutes = duration / 60;
  const targetFrameCount = Math.max(
    8,
    Math.min(30, Math.round(durationMinutes * 2.5))
  );

  switch (strategy) {
    case 'uniform':
      return getUniformTimestamps(targetFrameCount, duration);

    case 'semantic':
      return getSemanticTimestamps(utterances, duration, targetFrameCount);

    case 'visual':
      return await getVisualTimestamps(videoPath, duration, targetFrameCount);

    case 'hybrid': {
      const semantic = getSemanticTimestamps(
        utterances,
        duration,
        targetFrameCount
      );
      const visual = await getVisualTimestamps(
        videoPath,
        duration,
        targetFrameCount
      );
      const combined = [...semantic, ...visual];
      // 去除 2 秒内重复的帧
      const uniqueTimestamps: number[] = [];
      const sorted = Array.from(new Set(combined)).sort((a, b) => a - b);
      if (sorted.length > 0) {
        uniqueTimestamps.push(sorted[0]);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - uniqueTimestamps[uniqueTimestamps.length - 1] > 2) {
            uniqueTimestamps.push(sorted[i]);
          }
        }
      }
      return adjustTimestampsCount(
        uniqueTimestamps,
        targetFrameCount,
        duration
      );
    }

    default:
      // 默认回退到 semantic
      return getSemanticTimestamps(utterances, duration, targetFrameCount);
  }
}

/**
 * 提取单帧图片
 */
function extractSingleFrame(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(
      `Extracting frame at ${timestamp}s from ${videoPath} to ${outputPath}`
    );

    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .outputOptions(['-q:v 2']) // 高质量 JPEG
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', async () => {
        console.log(`FFmpeg process ended for ${outputPath}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        try {
          await fs.access(outputPath);
          const stats = await fs.stat(outputPath);
          if (stats.size > 0) {
            console.log(
              `Successfully extracted frame to ${outputPath} (${stats.size} bytes)`
            );
            resolve();
          } else {
            console.error(`Frame file was created but is empty: ${outputPath}`);
            reject(
              new Error(`Frame file was created but is empty: ${outputPath}`)
            );
          }
        } catch (err) {
          console.error(`Frame file was not created: ${outputPath}`, err);
          reject(
            new Error(`Frame file was not created: ${outputPath} - ${err}`)
          );
        }
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`FFmpeg error extracting frame at ${timestamp}s:`);
        console.error('Error:', err.message);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        reject(err);
      })
      .run();
  });
}

/**
 * 关联时间戳和对应的文字
 */
function associateTextWithTimestamp(
  timestamp: number, // 秒
  utterances: AsrUtterance[]
): string {
  const contextWindow = 15;
  const timestampMs = timestamp * 1000;

  const relevantUtterances = utterances.filter(
    (utt) =>
      utt.end_time >= timestampMs - contextWindow * 1000 &&
      utt.start_time <= timestampMs + contextWindow * 1000
  );

  if (relevantUtterances.length === 0) {
    return '';
  }

  return relevantUtterances.map((utt) => utt.text).join(' ');
}

/**
 * 主函数：提取视频关键帧
 */
export async function extractKeyframes(
  videoPath: string,
  utterances: AsrUtterance[],
  outputDir: string,
  strategy: KeyframeStrategy = 'semantic',
  jobId?: string
): Promise<Keyframe[]> {
  try {
    const duration = await getVideoDuration(videoPath);
    console.log(`Video duration: ${duration} seconds`);
    if (duration === 0) throw new Error('Failed to get video duration');

    const timestamps = await calculateKeyframeTimestamps(
      utterances,
      duration,
      strategy,
      videoPath
    );
    console.log(
      `Extracting ${timestamps.length} keyframes with '${strategy}' strategy at:`,
      timestamps
    );

    const keyframesDir = path.join(outputDir, 'keyframes');
    await fs.mkdir(keyframesDir, { recursive: true });

    const keyframes: Keyframe[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(
        keyframesDir,
        `frame_${String(i + 1).padStart(3, '0')}.jpg`
      );

      if (jobId) {
        const progress = Math.round(((i + 1) / timestamps.length) * 100);
        progressManager.updateKeyframeProgress(
          jobId,
          progress,
          `提取关键帧 ${i + 1}/${timestamps.length}`
        );
      }

      await extractSingleFrame(videoPath, timestamp, outputPath);
      const text = associateTextWithTimestamp(timestamp, utterances);

      keyframes.push({
        timestamp,
        imagePath: outputPath,
        text
      });

      console.log(
        `Extracted keyframe ${i + 1}/${timestamps.length} at ${timestamp}s`
      );
    }

    const keyframesInfoPath = path.join(outputDir, 'keyframes.json');
    await fs.writeFile(
      keyframesInfoPath,
      JSON.stringify(keyframes, null, 2),
      'utf-8'
    );

    if (jobId) {
      progressManager.updateKeyframeProgress(jobId, 100, '关键帧提取完成');
    }

    return keyframes;
  } catch (error) {
    console.error('Error extracting keyframes:', error);
    if (jobId) {
      progressManager.updateKeyframeProgress(
        jobId,
        -1,
        `提取失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
    throw error;
  }
}
