import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { progressManager } from '../progress-manager';

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

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

/**
 * 获取视频时长（秒）
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const metadata = (await ffprobeAsync(videoPath)) as {
    format: { duration?: number };
  };
  return metadata.format.duration || 0;
}

/**
 * 基于 utterances 智能分段，计算关键帧提取时间点
 * 策略：根据视频时长按每分钟 2.5 帧的密度分配
 */
function calculateKeyframeTimestamps(
  utterances: AsrUtterance[],
  duration: number
): number[] {
  // 过滤掉无效的 utterances（start_time 或 end_time 为负数）
  const validUtterances = utterances.filter(
    (utt) => utt.start_time >= 0 && utt.end_time >= 0
  );

  if (validUtterances.length === 0) {
    // 如果没有 utterances，均匀分布
    const durationMinutes = duration / 60;
    const targetFrameCount = Math.max(
      8,
      Math.min(30, Math.round(durationMinutes * 2.5))
    );
    const interval = duration / (targetFrameCount + 1);
    return Array.from({ length: targetFrameCount }, (_, i) =>
      Math.round((i + 1) * interval)
    );
  }

  // 计算目标帧数
  const durationMinutes = duration / 60;
  const targetFrameCount = Math.max(
    8,
    Math.min(30, Math.round(durationMinutes * 2.5))
  );

  // 按语义分段：每 20-40 秒为一段
  const segments: { start: number; end: number; text: string }[] = [];
  let currentSegmentStart = validUtterances[0].start_time / 1000; // 转换为秒
  let currentSegmentText = '';
  const segmentDuration = Math.max(
    20,
    Math.min(40, duration / targetFrameCount)
  );

  for (let i = 0; i < validUtterances.length; i++) {
    const utt = validUtterances[i];
    currentSegmentText += utt.text + ' ';

    const uttEndTime = utt.end_time / 1000; // 转换为秒

    // 判断是否结束当前段
    const shouldEndSegment =
      i === validUtterances.length - 1 || // 最后一个
      uttEndTime - currentSegmentStart >= segmentDuration; // 超过段时长

    if (shouldEndSegment) {
      segments.push({
        start: currentSegmentStart,
        end: uttEndTime,
        text: currentSegmentText.trim()
      });

      if (i < validUtterances.length - 1) {
        currentSegmentStart = validUtterances[i + 1].start_time / 1000; // 转换为秒
        currentSegmentText = '';
      }
    }
  }

  // 从每段中选取中间时间点
  let timestamps = segments.map((seg) => Math.round((seg.start + seg.end) / 2));

  // 如果帧数不足，补充均匀分布的时间点
  if (timestamps.length < targetFrameCount) {
    const missing = targetFrameCount - timestamps.length;
    const interval = duration / (missing + 1);
    const additionalTimestamps = Array.from({ length: missing }, (_, i) =>
      Math.round((i + 1) * interval)
    );
    timestamps = [...timestamps, ...additionalTimestamps].sort((a, b) => a - b);
  }

  // 如果帧数过多，均匀抽样
  if (timestamps.length > targetFrameCount) {
    const step = timestamps.length / targetFrameCount;
    timestamps = Array.from(
      { length: targetFrameCount },
      (_, i) => timestamps[Math.floor(i * step)]
    );
  }

  // 去重并排序
  return Array.from(new Set(timestamps)).sort((a, b) => a - b);
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

        // 等待一小段时间确保文件系统完成写入
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 验证文件是否真的被创建
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
  // 找到该时间戳附近的 utterances（前后 15 秒）
  const contextWindow = 15;
  const timestampMs = timestamp * 1000; // 转换为毫秒以匹配 utterances

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
  jobId?: string
): Promise<Keyframe[]> {
  try {
    // 1. 获取视频时长
    const duration = await getVideoDuration(videoPath);
    console.log(`Video duration: ${duration} seconds`);

    if (duration === 0) {
      throw new Error('Failed to get video duration');
    }

    // 2. 计算关键帧时间点
    const timestamps = calculateKeyframeTimestamps(utterances, duration);
    console.log(`Extracting ${timestamps.length} keyframes at:`, timestamps);

    // 3. 创建输出目录
    const keyframesDir = path.join(outputDir, 'keyframes');
    await fs.mkdir(keyframesDir, { recursive: true });

    // 4. 提取每一帧
    const keyframes: Keyframe[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(
        keyframesDir,
        `frame_${String(i + 1).padStart(3, '0')}.jpg`
      );

      // 更新进度
      if (jobId) {
        const progress = Math.round(((i + 1) / timestamps.length) * 100);
        progressManager.updateKeyframeProgress(
          jobId,
          progress,
          `提取关键帧 ${i + 1}/${timestamps.length}`
        );
      }

      // 提取帧
      await extractSingleFrame(videoPath, timestamp, outputPath);

      // 关联文字
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

    // 5. 保存关键帧信息到 JSON
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
    throw error;
  }
}
