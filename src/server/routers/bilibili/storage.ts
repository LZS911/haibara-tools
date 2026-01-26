/**
 * Bilibili 下载历史存储模块
 * 已迁移到 SQLite，此文件为兼容层
 */

// 从 SQLite Repository 重新导出所有接口
export {
  type DownloadHistoryItem,
  readHistory,
  writeHistory,
  addDownloadRecord,
  getDownloadHistory,
  deleteHistoryRecord,
  clearHistory
} from '../../lib/sqlite/repositories/bilibili.repository';
