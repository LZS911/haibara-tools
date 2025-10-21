import fs from 'fs/promises';
import path from 'path';
import { getTrainingRecordsPath } from './data';
import type { TrainingRecord } from '@/types/voice-cloning';

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
