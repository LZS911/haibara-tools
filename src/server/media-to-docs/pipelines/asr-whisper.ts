import { TRPCError } from '@trpc/server';
import fs from 'fs/promises';
import path from 'path';
import { progressManager } from '../progress-manager';
import { pipeline } from '@huggingface/transformers';
import { convertAudioFormat } from '../../voice-cloning/audio-converter';
import wavefile from 'wavefile';

interface AsrUtterance {
  text: string;
  start_time: number;
  end_time: number;
}

// 全局缓存 pipeline 实例，避免重复加载
let transcriberInstance: Awaited<
  ReturnType<typeof pipeline<'automatic-speech-recognition'>>
> | null = null;

/**
 * Checks if a buffer is a WAV file.
 */
function isWav(data: Buffer): boolean {
  if (data.length < 44) return false;
  return (
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WAVE'
  );
}

/**
 * 获取或创建 Whisper transcriber 实例
 */
async function getTranscriber() {
  if (!transcriberInstance) {
    console.log('Initializing Whisper model (Xenova/whisper-base)...');
    // @ts-expect-error(复杂类型)
    transcriberInstance = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-base'
    );
    console.log('Whisper model initialized successfully.');
  }
  return transcriberInstance;
}

/**
 * 使用本地 Whisper 模型进行音频转录
 * @param audioPath 音频文件路径
 * @param jobId 任务 ID（用于进度更新）
 * @returns 转录结果，包含完整文本和时间戳信息
 */
export async function transcribeAudioFileWithWhisper(
  audioPath: string,
  jobId?: string
): Promise<{
  fullText: string;
  utterances: AsrUtterance[];
}> {
  try {
    if (jobId) {
      progressManager.updateTranscriptionProgress(
        jobId,
        0,
        '初始化 Whisper 模型...'
      );
    }

    // 获取 transcriber 实例
    const transcriber = await getTranscriber();

    if (jobId) {
      progressManager.updateTranscriptionProgress(jobId, 30, '开始转录音频...');
    }

    const audioBuffer = await fs.readFile(audioPath);
    let wavFilePath = audioPath;
    if (!isWav(audioBuffer)) {
      console.log('Audio is not in WAV format, converting...');
      wavFilePath = await convertAudioFormat(audioPath, 'wav');
    }

    console.log('Starting Whisper transcription for:', wavFilePath);

    // 执行转录
    // return_timestamps: 'word' 返回词级时间戳
    // chunk_length_s: 30 每次处理 30 秒音频
    const wavBuffer = await fs.readFile(wavFilePath);

    const wav = new wavefile.WaveFile(wavBuffer);
    wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
    wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000
    let audioData = wav.getSamples();
    if (Array.isArray(audioData)) {
      if (audioData.length > 1) {
        const SCALING_FACTOR = Math.sqrt(2);

        // Merge channels (into first channel to save memory)
        for (let i = 0; i < audioData[0].length; ++i) {
          audioData[0][i] =
            (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
        }
      }

      // Select first channel
      audioData = audioData[0];
    }

    let output = await transcriber(audioData, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5
    });

    if (jobId) {
      progressManager.updateTranscriptionProgress(jobId, 90, '处理转录结果...');
    }

    console.log(output, 'output =====================');

    console.log('Whisper transcription completed.');

    if (Array.isArray(output)) {
      output = output[0];
    }

    // 提取完整文本
    const fullText = output.text;

    // 转换 chunks 为 utterances
    const utterances: AsrUtterance[] = [];

    if (output.chunks && output.chunks.length > 0) {
      // 按句子或固定时间段分组 chunks
      let currentUtterance: AsrUtterance | null = null;
      const maxUtteranceGap = 1.0; // 最大间隔 1 秒，超过则开始新的 utterance

      for (const chunk of output.chunks) {
        const startTime = Math.round(chunk.timestamp[0] * 1000); // 转换为毫秒
        const endTime = chunk.timestamp[1]
          ? Math.round(chunk.timestamp[1] * 1000)
          : startTime + 1000; // 如果没有结束时间，默认加 1 秒
        const text = chunk.text.trim();

        if (!text) continue;

        if (!currentUtterance) {
          // 创建新的 utterance
          currentUtterance = {
            text,
            start_time: startTime,
            end_time: endTime
          };
        } else {
          // 检查是否应该合并到当前 utterance
          const gap = (startTime - currentUtterance.end_time) / 1000; // 转换为秒

          if (gap <= maxUtteranceGap) {
            // 合并到当前 utterance
            currentUtterance.text += ' ' + text;
            currentUtterance.end_time = endTime;
          } else {
            // 保存当前 utterance 并开始新的
            utterances.push(currentUtterance);
            currentUtterance = {
              text,
              start_time: startTime,
              end_time: endTime
            };
          }
        }
      }

      // 添加最后一个 utterance
      if (currentUtterance) {
        utterances.push(currentUtterance);
      }
    } else {
      // 如果没有 chunks，创建一个包含全部文本的 utterance
      utterances.push({
        text: fullText,
        start_time: 0,
        end_time: 0
      });
    }

    // 缓存结果
    const transcriptPath = path.join(
      path.dirname(audioPath),
      'transcript-whisper.txt'
    );
    const utterancesPath = path.join(
      path.dirname(audioPath),
      'utterances-whisper.json'
    );

    await fs.writeFile(transcriptPath, fullText, 'utf-8');
    await fs.writeFile(
      utterancesPath,
      JSON.stringify(utterances, null, 2),
      'utf-8'
    );

    if (jobId) {
      progressManager.updateTranscriptionProgress(
        jobId,
        100,
        'Whisper 转录完成'
      );
    }

    console.log(
      `Whisper transcription completed. Text length: ${fullText.length}, Utterances: ${utterances.length}`
    );

    return {
      fullText,
      utterances
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Whisper 转录过程中发生未知错误';
    console.error('Whisper transcription failed:', error);

    // 提供更详细的错误信息
    if (error instanceof Error && error.message.includes('pipeline')) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Whisper 模型加载失败，请确保网络连接正常以下载模型'
      });
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage
    });
  }
}
