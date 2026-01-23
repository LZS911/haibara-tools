import path from 'path';
import { getUserDataPath } from '../../lib/config';

export function getVoiceCloningRoot(): string {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'voice-cloning-jobs');
  }
  return path.join(process.cwd(), 'tmp', 'voice-cloning-jobs');
}

/**
 * 获取 TTS 音频存储目录
 */
export function getTtsRoot(): string {
  const root = getVoiceCloningRoot();
  return path.join(root, 'tts');
}

/**
 * 获取训练记录存储路径
 */
export function getTrainingRecordsPath(): string {
  const root = getVoiceCloningRoot();
  return path.join(root, 'training-records.json');
}

/**
 * 获取音色 ID 存储路径
 */
export function getSpeakerIDsPath(): string {
  const root = getVoiceCloningRoot();
  return path.join(root, 'speaker-ids.json');
}

/**
 * 获取语音合成记录存储路径
 */
export function getSynthesisRecordsPath(): string {
  const root = getVoiceCloningRoot();
  return path.join(root, 'synthesis-records.json');
}
