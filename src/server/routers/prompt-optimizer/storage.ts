/**
 * 提示词优化存储模块
 * 已迁移到 SQLite，此文件为兼容层
 */

// 从 SQLite Repository 重新导出所有接口
export {
  saveOptimization,
  listHistory,
  getHistoryItem,
  deleteHistoryItem,
  toggleFavorite,
  listFavorites,
  clearHistory,
  getPromptOptimizerRoot
} from '@/server/lib/sqlite/repositories/prompt-optimizer.repository';
