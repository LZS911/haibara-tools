import WebSocket from 'ws';
import { getConfig } from '../lib/config';
import { getTtsRoot } from './data';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

const VOLCANO_ENGINE_HOST = 'openspeech.bytedance.com';
const API_URL = `wss://${VOLCANO_ENGINE_HOST}/api/v1/tts/ws_binary`;

// 默认请求头（4字节）
// version: b0001 (4 bits)
// header size: b0001 (4 bits)
// message type: b0001 (Full client request) (4bits)
// message type specific flags: b0000 (none) (4bits)
// message serialization method: b0001 (JSON) (4 bits)
// message compression: b0001 (gzip) (4bits)
// reserved data: 0x00 (1 byte)
const DEFAULT_HEADER = Buffer.from([0x11, 0x10, 0x11, 0x00]);

interface TtsRequest {
  app: {
    appid: string;
    token: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    voice_type: string;
    encoding: string;
    speed_ratio: number;
    volume_ratio: number;
    pitch_ratio: number;
  };
  request: {
    reqid: string;
    text: string;
    text_type: string;
    operation: string;
  };
}

/**
 * 解析服务器响应
 */
function parseResponse(res: Buffer): {
  messageType: number;
  messageTypeSpecificFlags: number;
  payload: Buffer;
  sequenceNumber?: number;
  isLast: boolean;
  isError: boolean;
  errorMessage?: string;
} {
  const messageType = res[1] >> 4;
  const messageTypeSpecificFlags = res[1] & 0x0f;
  const headerSize = res[0] & 0x0f;
  const messageCompression = res[2] & 0x0f;
  const payload = res.subarray(headerSize * 4);

  let isLast = false;
  let isError = false;
  let errorMessage: string | undefined;
  let sequenceNumber: number | undefined;

  // 0xb = audio-only server response
  if (messageType === 0x0b) {
    if (messageTypeSpecificFlags !== 0) {
      sequenceNumber = payload.readInt32BE(0);
      // const payloadSize = payload.readUInt32BE(4);
      const audioData = payload.subarray(8);

      if (sequenceNumber < 0) {
        isLast = true;
      }

      return {
        messageType,
        messageTypeSpecificFlags,
        payload: audioData,
        sequenceNumber,
        isLast,
        isError
      };
    }
  }

  // 0xf = error message
  if (messageType === 0x0f) {
    isError = true;
    isLast = true;
    const code = payload.readUInt32BE(0);
    // const msgSize = payload.readUInt32BE(4);
    let errorMsg = payload.subarray(8);

    if (messageCompression === 1) {
      errorMsg = zlib.gunzipSync(errorMsg);
    }

    errorMessage = `Error ${code}: ${errorMsg.toString('utf-8')}`;
  }

  return {
    messageType,
    messageTypeSpecificFlags,
    payload,
    isLast,
    isError,
    errorMessage
  };
}

/**
 * 构建 TTS 请求
 */
async function buildTtsRequest(
  text: string,
  speakerId: string,
  operation: 'submit' | 'query' = 'submit'
): Promise<Buffer> {
  const config = getConfig();
  const appId = config.VOLC_APP_ID;
  const token = config.VOLC_ACCESS_TOKEN;

  if (!appId || !token) {
    throw new Error('VOLC_APP_ID 和 VOLC_ACCESS_TOKEN 未配置');
  }

  const requestJson: TtsRequest = {
    app: {
      appid: appId,
      token: 'access_token',
      cluster: 'volcano_tts'
    },
    user: {
      uid: '388808087185088'
    },
    audio: {
      voice_type: speakerId,
      encoding: 'mp3',
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0
    },
    request: {
      reqid: nanoid(),
      text: text,
      text_type: 'plain',
      operation: operation
    }
  };

  // 序列化并压缩
  const payloadBytes = Buffer.from(JSON.stringify(requestJson), 'utf-8');
  const compressedPayload = await gzip(payloadBytes);

  // 构建完整请求
  const fullRequest = Buffer.concat([
    DEFAULT_HEADER,
    Buffer.from([
      (compressedPayload.length >> 24) & 0xff,
      (compressedPayload.length >> 16) & 0xff,
      (compressedPayload.length >> 8) & 0xff,
      compressedPayload.length & 0xff
    ]),
    compressedPayload
  ]);

  return fullRequest;
}

/**
 * 使用 WebSocket 合成语音
 */
export async function synthesizeSpeech(
  text: string,
  speakerId: string
): Promise<{ audioPath: string; audioUrl: string }> {
  const config = getConfig();
  const token = config.VOLC_ACCESS_TOKEN;

  if (!token) {
    throw new Error('VOLC_ACCESS_TOKEN 未配置');
  }

  // 确保输出目录存在
  const ttsRoot = getTtsRoot();
  await fs.mkdir(ttsRoot, { recursive: true });

  const audioFileName = `${nanoid()}.mp3`;
  const audioPath = path.join(ttsRoot, audioFileName);
  const audioUrl = `/voice-cloning-files/tts/${audioFileName}`;

  return new Promise((resolve, reject) => {
    const audioChunks: Buffer[] = [];

    const ws = new WebSocket(API_URL, {
      headers: {
        Authorization: `Bearer; ${token}`
      }
    });

    ws.on('open', async () => {
      try {
        const request = await buildTtsRequest(text, speakerId, 'submit');
        ws.send(request);
      } catch (error) {
        reject(error);
      }
    });

    ws.on('message', (data: Buffer) => {
      const response = parseResponse(data);

      if (response.isError) {
        ws.close();
        reject(new Error(response.errorMessage || 'TTS 合成失败'));
        return;
      }

      // 收集音频数据
      if (response.messageType === 0x0b && response.payload.length > 0) {
        audioChunks.push(response.payload);
      }

      // 最后一个包
      if (response.isLast) {
        ws.close();
      }
    });

    ws.on('close', async () => {
      try {
        if (audioChunks.length > 0) {
          const audioBuffer = Buffer.concat(audioChunks);
          await fs.writeFile(audioPath, audioBuffer);
          resolve({ audioPath, audioUrl });
        } else {
          reject(new Error('未收到音频数据'));
        }
      } catch (error) {
        reject(error);
      }
    });

    ws.on('error', (error) => {
      reject(new Error(`WebSocket 错误: ${error.message}`));
    });
  });
}
