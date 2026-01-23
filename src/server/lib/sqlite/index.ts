/**
 * SQLite 存储模块统一导出
 */

export { getDatabase, closeDatabase, getDatabasePath } from './database';
export { runMigrations } from './migrations';
export { migrateFromJson } from './migrate-json';

// Repository 实例
export { gitRepository } from './repositories/git.repository';
export { bilibiliRepository } from './repositories/bilibili.repository';
export { docsRepository } from './repositories/docs.repository';
export { promptOptimizerRepository } from './repositories/prompt-optimizer.repository';
export { voiceCloningRepository } from './repositories/voice-cloning.repository';

// 类型导出
export type { GitRepository, PRRecord } from './repositories/git.repository';
export type { DownloadHistoryItem } from './repositories/bilibili.repository';
