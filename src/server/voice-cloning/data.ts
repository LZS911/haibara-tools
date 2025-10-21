import path from 'path';
import { getUserDataPath } from '../lib/config';

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
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'voice-cloning-tts');
  }
  return path.join(process.cwd(), 'tmp', 'voice-cloning-tts');
}

/**
 * 获取训练记录存储路径
 */
export function getTrainingRecordsPath(): string {
  const root = getVoiceCloningRoot();
  return path.join(root, 'training-records.json');
}
