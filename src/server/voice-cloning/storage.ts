import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import {
  getSpeakerIDsPath,
  getTrainingRecordsPath,
  getSynthesisRecordsPath
} from './data';
import type {
  TrainingRecord,
  Speaker,
  SynthesisRecord
} from '@/types/voice-cloning';

// Speaker ID Management

/**
 * 读取所有音色 ID
 */
export async function loadSpeakerIDs(): Promise<Speaker[]> {
  const speakerIDsPath = getSpeakerIDsPath();
  try {
    await fs.access(speakerIDsPath);
    const content = await fs.readFile(speakerIDsPath, 'utf-8');
    return JSON.parse(content) as Speaker[];
  } catch (error) {
    console.error('Failed to load speaker IDs:', error);
    return [];
  }
}

/**
 * 保存音色 ID
 */
export async function saveSpeakerIDs(speakers: Speaker[]): Promise<void> {
  const speakerIDsPath = getSpeakerIDsPath();
  const dir = path.dirname(speakerIDsPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    speakerIDsPath,
    JSON.stringify(speakers, null, 2),
    'utf-8'
  );
}

/**
 * 添加音色 ID
 */
export async function addSpeakerID(speaker: Speaker): Promise<void> {
  const speakers = await loadSpeakerIDs();
  const index = speakers.findIndex((s) => s.id === speaker.id);

  if (index === -1) {
    speakers.push(speaker);
    await saveSpeakerIDs(speakers);
  }
}

/**
 * 删除音色 ID
 */
export async function deleteSpeakerID(speakerId: string): Promise<void> {
  const speakers = await loadSpeakerIDs();
  const filtered = speakers.filter((s) => s.id !== speakerId);
  await saveSpeakerIDs(filtered);
}

/**
 * 获取所有音色 ID 列表
 */
export async function listSpeakerIDs(): Promise<Speaker[]> {
  const speakers = await loadSpeakerIDs();
  return speakers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Training Record Management

/**
 * 读取所有训练记录
 */
export async function loadTrainingRecords(): Promise<TrainingRecord[]> {
  const recordsPath = getTrainingRecordsPath();

  try {
    const content = await fs.readFile(recordsPath, 'utf-8');
    return JSON.parse(content) as TrainingRecord[];
  } catch (error) {
    console.error('Failed to load training records:', error);
    return [];
  }
}

/**
 * 保存训练记录
 */
export async function saveTrainingRecords(
  records: TrainingRecord[]
): Promise<void> {
  const recordsPath = getTrainingRecordsPath();
  const dir = path.dirname(recordsPath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(recordsPath, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * 添加或更新训练记录
 */
export async function upsertTrainingRecord(
  record: TrainingRecord
): Promise<void> {
  const records = await loadTrainingRecords();
  const index = records.findIndex((r) => r.speakerId === record.speakerId);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  await saveTrainingRecords(records);
}

/**
 * 获取训练记录
 */
export async function getTrainingRecord(
  speakerId: string
): Promise<TrainingRecord | null> {
  const records = await loadTrainingRecords();
  return records.find((r) => r.speakerId === speakerId) || null;
}

/**
 * 删除训练记录
 */
export async function deleteTrainingRecord(speakerId: string): Promise<void> {
  const records = await loadTrainingRecords();
  const filtered = records.filter((r) => r.speakerId !== speakerId);
  await saveTrainingRecords(filtered);
}

/**
 * 获取所有训练列表（包含最新状态）
 */
export async function listAllTrainings(): Promise<TrainingRecord[]> {
  const records = await loadTrainingRecords();

  // 按创建时间倒序排序
  return records.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Synthesis Record Management

/**
 * 读取所有语音合成记录
 */
export async function loadSynthesisRecords(): Promise<SynthesisRecord[]> {
  const recordsPath = getSynthesisRecordsPath();

  try {
    const content = await fs.readFile(recordsPath, 'utf-8');
    return JSON.parse(content) as SynthesisRecord[];
  } catch (error) {
    console.error('Failed to load synthesis records:', error);
    return [];
  }
}

/**
 * 保存语音合成记录
 */
export async function saveSynthesisRecords(
  records: SynthesisRecord[]
): Promise<void> {
  const recordsPath = getSynthesisRecordsPath();
  const dir = path.dirname(recordsPath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(recordsPath, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * 添加语音合成记录
 */
export async function addSynthesisRecord(
  record: SynthesisRecord
): Promise<void> {
  const records = await loadSynthesisRecords();
  records.push({
    ...record,
    id: nanoid(),
    createdAt: new Date().toISOString()
  });
  await saveSynthesisRecords(records);
}

/**
 * 获取所有语音合成记录列表
 */
export async function listSynthesisRecords(): Promise<SynthesisRecord[]> {
  const records = await loadSynthesisRecords();

  // 按创建时间倒序排序
  return records.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * 删除语音合成记录
 */
export async function deleteSynthesisRecord(id: string): Promise<void> {
  const records = await loadSynthesisRecords();
  const filtered = records.filter((r) => r.id !== id);
  await saveSynthesisRecords(filtered);
}
