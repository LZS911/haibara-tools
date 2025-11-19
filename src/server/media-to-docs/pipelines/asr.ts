import { TRPCError } from '@trpc/server';
import WebSocket from 'ws';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { progressManager } from '../progress-manager';
import { getConfig } from '../../lib/config';
import { nanoid } from 'nanoid';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// BV1Zm4y197t6
// --- Constants based on Python script ---
const DEFAULT_SAMPLE_RATE = 16000;
const URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream';

const ProtocolVersion = { V1: 0b0001 };
const MessageType = {
  CLIENT_FULL_REQUEST: 0b0001,
  CLIENT_AUDIO_ONLY_REQUEST: 0b0010,
  SERVER_FULL_RESPONSE: 0b1001,
  SERVER_ERROR_RESPONSE: 0b1111
};
const MessageTypeSpecificFlags = {
  NO_SEQUENCE: 0b0000,
  POS_SEQUENCE: 0b0001,
  NEG_SEQUENCE: 0b0010,
  NEG_WITH_SEQUENCE: 0b0011
};
const SerializationType = {
  NO_SERIALIZATION: 0b0000,
  JSON: 0b0001
};
const CompressionType = { GZIP: 0b0001 };

// --- Utilities ---

/**
 * Converts an audio file to 16-bit, 16kHz mono WAV using ffmpeg.
 */
function convertToWav(audioPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isPackaged = process.env.IS_PACKAGED === 'true';
    const ffmpegPath = isPackaged
      ? ffmpegInstaller.path.replace(
          `${path.sep}app.asar${path.sep}`,
          `${path.sep}app.asar.unpacked${path.sep}`
        )
      : ffmpegInstaller.path;
    const ffmpeg = spawn(ffmpegPath, [
      '-v',
      'quiet',
      '-y',
      '-i',
      audioPath,
      '-acodec',
      'pcm_s16le',
      '-ac',
      '1',
      '-ar',
      String(DEFAULT_SAMPLE_RATE),
      '-f',
      'wav',
      '-' // Output to stdout
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (data) =>
      console.error(`[ffmpeg stderr]: ${data}`)
    );
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg process exited with code ${code}`));
      }
    });
    ffmpeg.on('error', (err) => reject(err));
  });
}

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
 * Parses WAV header to get audio properties.
 */
function readWavInfo(data: Buffer): {
  numChannels: number;
  sampleRate: number;
  sampWidth: number;
  waveData: Buffer;
} {
  if (!isWav(data)) throw new Error('Invalid WAV file format');

  const numChannels = data.readUInt16LE(22);
  const sampleRate = data.readUInt32LE(24);
  const bitsPerSample = data.readUInt16LE(34);
  const sampWidth = bitsPerSample / 8;

  let pos = 36;
  while (pos < data.length - 8) {
    const subchunkId = data.toString('ascii', pos, pos + 4);
    const subchunkSize = data.readUInt32LE(pos + 4);
    if (subchunkId === 'data') {
      const waveData = data.subarray(pos + 8, pos + 8 + subchunkSize);
      return { numChannels, sampleRate, sampWidth, waveData };
    }
    pos += 8 + subchunkSize;
  }
  throw new Error('Invalid WAV file: no data subchunk found');
}

// --- Protocol Message Builders and Parsers ---

class AsrRequestHeader {
  messageType = MessageType.CLIENT_FULL_REQUEST;
  messageTypeSpecificFlags = MessageTypeSpecificFlags.POS_SEQUENCE;
  serializationType = SerializationType.JSON;
  compressionType = CompressionType.GZIP;
  reservedData = Buffer.from([0x00]);

  toBuffer(): Buffer {
    const header = Buffer.alloc(4);
    header[0] = (ProtocolVersion.V1 << 4) | 1; // Version and header size
    header[1] = (this.messageType << 4) | this.messageTypeSpecificFlags;
    header[2] = (this.serializationType << 4) | this.compressionType;
    header[3] = this.reservedData[0];
    return header;
  }
}

const RequestBuilder = {
  newAuthHeaders: () => {
    const { VOLC_APP_ID, VOLC_ACCESS_TOKEN } = getConfig();
    if (!VOLC_APP_ID || !VOLC_ACCESS_TOKEN) {
      throw new Error(
        'Volcano Engine credentials not configured in newAuthHeaders'
      );
    }
    return {
      'X-Api-Resource-Id': 'volc.bigasr.sauc.duration',
      'X-Api-Request-Id': nanoid(),
      'X-Api-Access-Key': VOLC_ACCESS_TOKEN,
      'X-Api-App-Key': VOLC_APP_ID
    };
  },

  newFullClientRequest: async (seq: number): Promise<Buffer> => {
    const header = new AsrRequestHeader();
    header.messageTypeSpecificFlags = MessageTypeSpecificFlags.POS_SEQUENCE;

    const payload = {
      user: { uid: nanoid() },
      audio: { format: 'pcm', codec: 'raw', rate: 16000, bits: 16, channel: 1 },
      request: {
        model_name: 'bigmodel',
        enable_itn: true,
        enable_punc: true,
        enable_ddc: true,
        show_utterances: true,
        enable_nonstream: false
      }
    };

    const compressedPayload = await gzipAsync(JSON.stringify(payload));
    const seqBuffer = Buffer.alloc(4);
    seqBuffer.writeInt32BE(seq);
    const payloadSizeBuffer = Buffer.alloc(4);
    payloadSizeBuffer.writeUInt32BE(compressedPayload.length);

    return Buffer.concat([
      header.toBuffer(),
      seqBuffer,
      payloadSizeBuffer,
      compressedPayload
    ]);
  },

  newAudioOnlyRequest: async (
    seq: number,
    segment: Buffer,
    isLast: boolean
  ): Promise<Buffer> => {
    const header = new AsrRequestHeader();
    header.messageType = MessageType.CLIENT_AUDIO_ONLY_REQUEST;

    if (isLast) {
      header.messageTypeSpecificFlags =
        MessageTypeSpecificFlags.NEG_WITH_SEQUENCE;
      seq = -seq;
    } else {
      header.messageTypeSpecificFlags = MessageTypeSpecificFlags.POS_SEQUENCE;
    }

    const seqBuffer = Buffer.alloc(4);
    seqBuffer.writeInt32BE(seq);

    const compressedSegment = await gzipAsync(segment);
    const payloadSizeBuffer = Buffer.alloc(4);
    payloadSizeBuffer.writeUInt32BE(compressedSegment.length);

    return Buffer.concat([
      header.toBuffer(),
      seqBuffer,
      payloadSizeBuffer,
      compressedSegment
    ]);
  }
};

interface AsrUtterance {
  text: string;
  start_time: number;
  end_time: number;
  words?: Array<{
    text: string;
    start_time: number;
    end_time: number;
  }>;
}

interface AsrResult {
  utterances: AsrUtterance[];
  text?: string;
}

interface AsrPayloadMsg {
  code?: number;
  message?: string;
  result?: AsrResult;
}

interface AsrResponse {
  code: number;
  event: number;
  isLastPackage: boolean;
  payloadSequence: number;
  payloadSize: number;
  payloadMsg: AsrPayloadMsg;
}

const ResponseParser = {
  parseResponse: async (msg: Buffer): Promise<AsrResponse> => {
    const response: Partial<AsrResponse> = {};

    const headerSize = msg[0] & 0x0f;
    const messageType = msg[1] >> 4;
    const messageTypeSpecificFlags = msg[1] & 0x0f;
    const serializationMethod = msg[2] >> 4;
    const messageCompression = msg[2] & 0x0f;

    let payload = msg.subarray(headerSize * 4);

    if (messageTypeSpecificFlags & 0x01) {
      response.payloadSequence = payload.readInt32BE(0);
      payload = payload.subarray(4);
    }
    response.isLastPackage = !!(messageTypeSpecificFlags & 0x02);
    if (messageTypeSpecificFlags & 0x04) {
      response.event = payload.readInt32BE(0);
      payload = payload.subarray(4);
    }

    if (messageType === MessageType.SERVER_FULL_RESPONSE) {
      response.payloadSize = payload.readUInt32BE(0);
      payload = payload.subarray(4);
    } else if (messageType === MessageType.SERVER_ERROR_RESPONSE) {
      response.code = payload.readInt32BE(0);
      response.payloadSize = payload.readUInt32BE(4);
      payload = payload.subarray(8);
    }

    if (payload.length > 0) {
      if (messageCompression === CompressionType.GZIP) {
        try {
          payload = await gunzipAsync(payload);
        } catch (e) {
          console.error('Failed to decompress payload:', e);
        }
      }

      if (
        serializationMethod === SerializationType.JSON &&
        payload.length > 0
      ) {
        try {
          response.payloadMsg = JSON.parse(payload.toString('utf-8'));
        } catch (e) {
          console.error('Failed to parse payload JSON:', e);
        }
      }
    }

    return response as AsrResponse;
  }
};

// --- WebSocket Client ---

class AsrWsClient {
  private seq = 1;
  private segmentDuration = 200; // ms

  public execute(filePath: string, jobId?: string): Promise<AsrResponse[]> {
    return new Promise((resolve, reject) => {
      const { VOLC_APP_ID, VOLC_ACCESS_TOKEN } = getConfig();
      if (!VOLC_APP_ID || !VOLC_ACCESS_TOKEN) {
        return reject(
          new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '火山引擎凭证未配置'
          })
        );
      }

      const setupAndConnect = async () => {
        // 1. Read and convert audio file
        let audioBuffer = await fs.readFile(filePath);
        if (!isWav(audioBuffer)) {
          console.log('Audio is not in WAV format, converting...');
          audioBuffer = await convertToWav(filePath);
        }
        const { numChannels, sampleRate, sampWidth, waveData } =
          readWavInfo(audioBuffer);
        const segmentSize =
          (numChannels * sampWidth * sampleRate * this.segmentDuration) / 1000;

        // 2. Create WebSocket connection
        const ws = new WebSocket(URL, {
          headers: RequestBuilder.newAuthHeaders()
        });
        const responses: AsrResponse[] = [];

        ws.on('message', async (data: Buffer) => {
          const response = await ResponseParser.parseResponse(data);
          responses.push(response);
          if (
            response.isLastPackage ||
            (response.code && response.code !== 0)
          ) {
            ws.close();
            if (response.code && response.code !== 0) {
              reject(
                new Error(
                  `ASR Error: ${response.payloadMsg?.message || 'Unknown error'}`
                )
              );
            } else {
              resolve(responses);
            }
          }
        });

        ws.on('open', () => {
          const sendAudioStream = async () => {
            // 3. Send full client request
            console.log('WebSocket connected, sending initial request...');
            const fullRequest = await RequestBuilder.newFullClientRequest(
              this.seq++
            );
            ws.send(fullRequest);

            // 4. Start streaming audio with pipelined preparation
            console.log('Sending audio segments...');
            const segments = this.splitAudio(waveData, segmentSize);
            let lastProgressUpdate = 0;

            // 准备第一个片段的请求（提前准备）
            let nextRequestPromise: Promise<Buffer> | null = null;
            if (segments.length > 0) {
              const isLast = segments.length === 1;
              nextRequestPromise = RequestBuilder.newAudioOnlyRequest(
                this.seq,
                segments[0],
                isLast
              );
            }

            for (let i = 0; i < segments.length; i++) {
              const isLast = i === segments.length - 1;

              // 等待当前片段的请求准备完成（如果是第一个，已经准备好了）
              const audioRequest = nextRequestPromise
                ? await nextRequestPromise
                : await RequestBuilder.newAudioOnlyRequest(
                    this.seq,
                    segments[i],
                    isLast
                  );

              // 发送当前片段
              ws.send(audioRequest);
              if (!isLast) this.seq++;

              // 并行准备下一个片段（如果还有下一个）
              if (i < segments.length - 1) {
                const nextIsLast = i + 1 === segments.length - 1;
                nextRequestPromise = RequestBuilder.newAudioOnlyRequest(
                  this.seq,
                  segments[i + 1],
                  nextIsLast
                );
              } else {
                nextRequestPromise = null;
              }

              // 更新 ASR 进度（节流）
              if (jobId) {
                const now = Date.now();
                const progress = Math.round(((i + 1) / segments.length) * 100);
                // 每1秒更新一次，或者是最后一个片段
                if (now - lastProgressUpdate >= 1000 || isLast) {
                  progressManager.updateTranscriptionProgress(
                    jobId,
                    progress,
                    `正在发送音频片段 ${i + 1}/${segments.length}`
                  );
                  lastProgressUpdate = now;
                }
              }

              // 最后一个片段发送后不等待，其他片段等待200ms
              if (!isLast) {
                await new Promise((r) => setTimeout(r, this.segmentDuration));
              }
            }
            console.log('All audio segments sent.');
          };

          sendAudioStream().catch((e) => {
            reject(e);
            ws.close();
          });
        });

        ws.on('error', (err) => {
          console.error('WebSocket error:', err);
          reject(err);
        });

        ws.on('close', (code, reason) => {
          console.log(
            `WebSocket closed. Code: ${code}, Reason: ${reason.toString()}`
          );
          // Resolve with what we have if the connection closes unexpectedly
          if (responses.length > 0 && !responses.some((r) => r.isLastPackage)) {
            resolve(responses);
          }
        });
      };

      setupAndConnect().catch((error) => {
        console.error('Error in ASR execution:', error);
        reject(error);
      });
    });
  }

  private splitAudio(data: Buffer, segmentSize: number): Buffer[] {
    if (segmentSize <= 0) return [];
    const segments: Buffer[] = [];
    for (let i = 0; i < data.length; i += segmentSize) {
      const end = Math.min(i + segmentSize, data.length);
      segments.push(data.subarray(i, end));
    }
    return segments;
  }
}

/**
 * Performs audio transcription using the Volcano Engine ASR service.
 * This function encapsulates the entire process:
 * 1. Initializes the ASR WebSocket client.
 * 2. Executes the transcription process for the given audio file path.
 * 3. Parses the responses to build the final, coherent transcript.
 * 4. Saves the transcript to a cache file.
 * 5. Handles potential errors during the process.
 *
 * @param audioPath The local path to the audio file to be transcribed.
 * @returns A promise that resolves to an object containing the full text and utterance details.
 */
export async function transcribeAudioFile(
  audioPath: string,
  jobId?: string
): Promise<{
  fullText: string;
  utterances: AsrUtterance[];
}> {
  const client = new AsrWsClient();
  try {
    const responses = await client.execute(audioPath, jobId);
    const utteranceMap = new Map<number, AsrUtterance>();

    responses
      .filter(
        (r) =>
          r.payloadMsg?.result?.utterances &&
          r.payloadMsg.result.utterances.length > 0
      )
      .forEach((r) => {
        r.payloadMsg.result!.utterances.forEach((u) => {
          utteranceMap.set(u.start_time, u);
        });
      });

    const utterances = Array.from(utteranceMap.values()).sort(
      (a, b) => a.start_time - b.start_time
    );

    const fullText = utterances.map((u) => u.text).join('\n');

    // Cache the result
    const transcriptPath = path.join(path.dirname(audioPath), 'transcript.txt');
    await fs.writeFile(transcriptPath, fullText, 'utf-8');

    // Also save the detailed utterances for potential future use
    const utterancesPath = path.join(
      path.dirname(audioPath),
      'utterances.json'
    );
    await fs.writeFile(
      utterancesPath,
      JSON.stringify(utterances, null, 2),
      'utf-8'
    );

    return {
      fullText,
      utterances
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during transcription.';
    console.error('Transcription failed:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage
    });
  }
}
