import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getUserDataPath } from '../config';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;

/**
 * 获取数据库文件路径
 */
export function getDatabasePath(): string {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'haibara-tools.db');
  }
  // 开发环境回退路径
  return path.join(process.cwd(), 'tmp', 'haibara-tools.db');
}

/**
 * 确保目录存在
 */
function ensureDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取数据库实例
 * 延迟初始化，首次调用时创建连接
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  ensureDirectory(dbPath);

  console.log(`[SQLite] Initializing database at: ${dbPath}`);

  db = new Database(dbPath);

  // 启用 WAL 模式，提升并发性能
  db.pragma('journal_mode = WAL');

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 设置忙等待超时（5秒）
  db.pragma('busy_timeout = 5000');

  // 运行 Schema 迁移
  runMigrations(db);

  // 运行 JSON 数据迁移（延迟导入避免循环依赖）
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { migrateFromJson } = require('./migrate-json') as {
    migrateFromJson: () => void;
  };
  migrateFromJson();

  console.log('[SQLite] Database initialized successfully');

  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[SQLite] Closing database connection');
    db.close();
    db = null;
  }
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * 重置数据库（仅用于测试）
 */
export function resetDatabase(): void {
  closeDatabase();
  const dbPath = getDatabasePath();
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  // 同时删除 WAL 和 SHM 文件
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
}

// 进程退出时关闭数据库连接
process.on('exit', () => {
  closeDatabase();
});

process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
