import { nanoid } from 'nanoid';
import { BaseRepository } from './base.repository';
import type {
  TrainingRecord,
  Speaker,
  SynthesisRecord
} from '@/types/voice-cloning';

// 数据库行类型
interface SpeakerRow {
  id: string;
  name: string;
  created_at: string;
}

interface TrainingRecordRow {
  speaker_id: string;
  bv_id: string;
  title: string;
  audio_path: string;
  status: number;
  created_at: string;
  completed_at: string | null;
}

interface SynthesisRecordRow {
  id: string;
  speaker_id: string;
  text: string;
  audio_url: string;
  audio_path: string;
  created_at: string;
}

/**
 * 语音克隆 Repository
 */
class VoiceCloningRepositoryImpl extends BaseRepository {
  // ============ 转换方法 ============

  private rowToSpeaker(row: SpeakerRow): Speaker {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    };
  }

  private rowToTrainingRecord(row: TrainingRecordRow): TrainingRecord {
    return {
      speakerId: row.speaker_id,
      bvId: row.bv_id,
      title: row.title,
      audioPath: row.audio_path,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined
    };
  }

  private rowToSynthesisRecord(row: SynthesisRecordRow): SynthesisRecord {
    return {
      id: row.id,
      speakerId: row.speaker_id,
      text: row.text,
      audioUrl: row.audio_url,
      audioPath: row.audio_path,
      createdAt: row.created_at
    };
  }

  // ============ Speaker ID Management ============

  /**
   * 读取所有音色 ID
   */
  loadSpeakerIDs(): Speaker[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_speakers')
      .all() as SpeakerRow[];
    return rows.map((row) => this.rowToSpeaker(row));
  }

  /**
   * 保存音色 ID（全量替换）
   */
  saveSpeakerIDs(speakers: Speaker[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM voice_speakers').run();
      const insert = this.db.prepare(`
        INSERT INTO voice_speakers (id, name, created_at)
        VALUES (?, ?, ?)
      `);
      for (const speaker of speakers) {
        insert.run(speaker.id, speaker.name, speaker.createdAt);
      }
    });
  }

  /**
   * 添加音色 ID
   */
  addSpeakerID(speaker: Speaker): void {
    const existing = this.db
      .prepare('SELECT id FROM voice_speakers WHERE id = ?')
      .get(speaker.id);

    if (!existing) {
      this.db
        .prepare(
          'INSERT INTO voice_speakers (id, name, created_at) VALUES (?, ?, ?)'
        )
        .run(speaker.id, speaker.name, speaker.createdAt);
    }
  }

  /**
   * 删除音色 ID（CASCADE 会自动删除关联记录）
   */
  deleteSpeakerID(speakerId: string): void {
    this.db.prepare('DELETE FROM voice_speakers WHERE id = ?').run(speakerId);
  }

  /**
   * 获取所有音色 ID 列表
   */
  listSpeakerIDs(): Speaker[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_speakers ORDER BY created_at DESC')
      .all() as SpeakerRow[];
    return rows.map((row) => this.rowToSpeaker(row));
  }

  // ============ Training Record Management ============

  /**
   * 读取所有训练记录
   */
  loadTrainingRecords(): TrainingRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_training_records')
      .all() as TrainingRecordRow[];
    return rows.map((row) => this.rowToTrainingRecord(row));
  }

  /**
   * 保存训练记录（全量替换）
   */
  saveTrainingRecords(records: TrainingRecord[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM voice_training_records').run();
      const insert = this.db.prepare(`
        INSERT INTO voice_training_records 
        (speaker_id, bv_id, title, audio_path, status, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const record of records) {
        insert.run(
          record.speakerId,
          record.bvId,
          record.title,
          record.audioPath,
          record.status,
          record.createdAt,
          record.completedAt ?? null
        );
      }
    });
  }

  /**
   * 添加或更新训练记录
   */
  upsertTrainingRecord(record: TrainingRecord): void {
    this.db
      .prepare(
        `
      INSERT INTO voice_training_records 
      (speaker_id, bv_id, title, audio_path, status, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(speaker_id) DO UPDATE SET
        bv_id = excluded.bv_id,
        title = excluded.title,
        audio_path = excluded.audio_path,
        status = excluded.status,
        created_at = excluded.created_at,
        completed_at = excluded.completed_at
    `
      )
      .run(
        record.speakerId,
        record.bvId,
        record.title,
        record.audioPath,
        record.status,
        record.createdAt,
        record.completedAt ?? null
      );
  }

  /**
   * 获取训练记录
   */
  getTrainingRecord(speakerId: string): TrainingRecord | null {
    const row = this.db
      .prepare('SELECT * FROM voice_training_records WHERE speaker_id = ?')
      .get(speakerId) as TrainingRecordRow | undefined;
    return row ? this.rowToTrainingRecord(row) : null;
  }

  /**
   * 删除训练记录
   */
  deleteTrainingRecord(speakerId: string): void {
    this.db
      .prepare('DELETE FROM voice_training_records WHERE speaker_id = ?')
      .run(speakerId);
  }

  /**
   * 获取所有训练列表（包含最新状态）
   */
  listAllTrainings(): TrainingRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_training_records ORDER BY created_at DESC')
      .all() as TrainingRecordRow[];
    return rows.map((row) => this.rowToTrainingRecord(row));
  }

  // ============ Synthesis Record Management ============

  /**
   * 读取所有语音合成记录
   */
  loadSynthesisRecords(): SynthesisRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_synthesis_records')
      .all() as SynthesisRecordRow[];
    return rows.map((row) => this.rowToSynthesisRecord(row));
  }

  /**
   * 保存语音合成记录（全量替换）
   */
  saveSynthesisRecords(records: SynthesisRecord[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM voice_synthesis_records').run();
      const insert = this.db.prepare(`
        INSERT INTO voice_synthesis_records 
        (id, speaker_id, text, audio_url, audio_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const record of records) {
        insert.run(
          record.id,
          record.speakerId,
          record.text,
          record.audioUrl,
          record.audioPath,
          record.createdAt
        );
      }
    });
  }

  /**
   * 添加语音合成记录
   */
  addSynthesisRecord(record: SynthesisRecord): void {
    const newRecord = {
      ...record,
      id: record.id || nanoid(),
      createdAt: record.createdAt || new Date().toISOString()
    };

    this.db
      .prepare(
        `
      INSERT INTO voice_synthesis_records 
      (id, speaker_id, text, audio_url, audio_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        newRecord.id,
        newRecord.speakerId,
        newRecord.text,
        newRecord.audioUrl,
        newRecord.audioPath,
        newRecord.createdAt
      );
  }

  /**
   * 获取所有语音合成记录列表
   */
  listSynthesisRecords(): SynthesisRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM voice_synthesis_records ORDER BY created_at DESC')
      .all() as SynthesisRecordRow[];
    return rows.map((row) => this.rowToSynthesisRecord(row));
  }

  /**
   * 删除语音合成记录
   */
  deleteSynthesisRecord(id: string): void {
    this.db.prepare('DELETE FROM voice_synthesis_records WHERE id = ?').run(id);
  }
}

// 导出单例实例
export const voiceCloningRepository = new VoiceCloningRepositoryImpl();

// 导出兼容的异步函数接口
export function loadSpeakerIDs(): Promise<Speaker[]> {
  return Promise.resolve(voiceCloningRepository.loadSpeakerIDs());
}

export function saveSpeakerIDs(speakers: Speaker[]): Promise<void> {
  voiceCloningRepository.saveSpeakerIDs(speakers);
  return Promise.resolve();
}

export function addSpeakerID(speaker: Speaker): Promise<void> {
  voiceCloningRepository.addSpeakerID(speaker);
  return Promise.resolve();
}

export function deleteSpeakerID(speakerId: string): Promise<void> {
  voiceCloningRepository.deleteSpeakerID(speakerId);
  return Promise.resolve();
}

export function listSpeakerIDs(): Promise<Speaker[]> {
  return Promise.resolve(voiceCloningRepository.listSpeakerIDs());
}

export function loadTrainingRecords(): Promise<TrainingRecord[]> {
  return Promise.resolve(voiceCloningRepository.loadTrainingRecords());
}

export function saveTrainingRecords(records: TrainingRecord[]): Promise<void> {
  voiceCloningRepository.saveTrainingRecords(records);
  return Promise.resolve();
}

export function upsertTrainingRecord(record: TrainingRecord): Promise<void> {
  voiceCloningRepository.upsertTrainingRecord(record);
  return Promise.resolve();
}

export function getTrainingRecord(
  speakerId: string
): Promise<TrainingRecord | null> {
  return Promise.resolve(voiceCloningRepository.getTrainingRecord(speakerId));
}

export function deleteTrainingRecord(speakerId: string): Promise<void> {
  voiceCloningRepository.deleteTrainingRecord(speakerId);
  return Promise.resolve();
}

export function listAllTrainings(): Promise<TrainingRecord[]> {
  return Promise.resolve(voiceCloningRepository.listAllTrainings());
}

export function loadSynthesisRecords(): Promise<SynthesisRecord[]> {
  return Promise.resolve(voiceCloningRepository.loadSynthesisRecords());
}

export function saveSynthesisRecords(
  records: SynthesisRecord[]
): Promise<void> {
  voiceCloningRepository.saveSynthesisRecords(records);
  return Promise.resolve();
}

export function addSynthesisRecord(record: SynthesisRecord): Promise<void> {
  voiceCloningRepository.addSynthesisRecord(record);
  return Promise.resolve();
}

export function listSynthesisRecords(): Promise<SynthesisRecord[]> {
  return Promise.resolve(voiceCloningRepository.listSynthesisRecords());
}

export function deleteSynthesisRecord(id: string): Promise<void> {
  voiceCloningRepository.deleteSynthesisRecord(id);
  return Promise.resolve();
}
