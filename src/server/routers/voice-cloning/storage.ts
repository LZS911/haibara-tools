/**
 * 语音克隆存储模块
 * 已迁移到 SQLite，此文件为兼容层
 */

// 从 SQLite Repository 重新导出所有接口
export {
  loadSpeakerIDs,
  saveSpeakerIDs,
  addSpeakerID,
  deleteSpeakerID,
  listSpeakerIDs,
  loadTrainingRecords,
  saveTrainingRecords,
  upsertTrainingRecord,
  getTrainingRecord,
  deleteTrainingRecord,
  listAllTrainings,
  loadSynthesisRecords,
  saveSynthesisRecords,
  addSynthesisRecord,
  listSynthesisRecords,
  deleteSynthesisRecord
} from '@/server/lib/sqlite/repositories/voice-cloning.repository';
