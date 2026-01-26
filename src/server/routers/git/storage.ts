/**
 * Git 仓库存储模块
 * 已迁移到 SQLite，此文件为兼容层
 */

// 从 SQLite Repository 重新导出所有接口
export {
  type GitRepository,
  type PRRecord,
  readRepositories,
  writeRepositories,
  addRepository,
  updateRepository,
  deleteRepository,
  getRepositoryById,
  readPRRecords,
  writePRRecords,
  upsertPRRecord,
  batchUpsertPRRecords,
  getPRRecordsByRepository,
  deletePRRecord,
  clearPRRecords,
  getPRRecordsByTimeRange
} from '@/server/lib/sqlite/repositories/git.repository';
