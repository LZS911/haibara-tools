/**
 * 文档管理存储模块
 * 已迁移到 SQLite，此文件为兼容层
 */

// 从 SQLite Repository 重新导出所有接口
export {
  listDocs,
  getDoc,
  createDoc,
  updateDoc,
  deleteDoc,
  saveDocAsset,
  getDocAssetPath,
  listDocAssets,
  deleteDocAsset,
  getSyncConfig,
  saveSyncConfig,
  updateDocSyncStatus,
  searchDocs,
  getDocSnippet,
  readDocIndex
} from '@/server/lib/sqlite/repositories/docs.repository';
