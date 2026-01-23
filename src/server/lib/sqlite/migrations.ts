import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * 内嵌的迁移 SQL（避免打包后文件读取问题）
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial',
    sql: `
-- 001_initial.sql
-- 初始数据库表结构

-- Git 仓库表
CREATE TABLE IF NOT EXISTS git_repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_path TEXT NOT NULL,
  github_owner TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  default_branch TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_git_repos_updated ON git_repositories(updated_at);

-- Git PR 记录表
CREATE TABLE IF NOT EXISTS git_pr_records (
  id INTEGER NOT NULL,
  repository_id TEXT NOT NULL,
  title TEXT NOT NULL,
  number INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('open', 'closed', 'merged')),
  html_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT,
  merged_at TEXT,
  author TEXT NOT NULL,
  base_branch TEXT NOT NULL,
  head_branch TEXT NOT NULL,
  PRIMARY KEY (repository_id, id),
  FOREIGN KEY (repository_id) REFERENCES git_repositories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pr_created ON git_pr_records(created_at);
CREATE INDEX IF NOT EXISTS idx_pr_repo ON git_pr_records(repository_id);

-- B站下载历史表
CREATE TABLE IF NOT EXISTS bilibili_download_history (
  id TEXT PRIMARY KEY,
  bv_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  quality INTEGER NOT NULL,
  video_path TEXT,
  audio_path TEXT,
  merged_path TEXT,
  cover_path TEXT,
  downloaded_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bili_downloaded ON bilibili_download_history(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bili_bvid ON bilibili_download_history(bv_id);

-- 文档表
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  template_id TEXT,
  synced_at INTEGER,
  github_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_docs_updated ON documents(updated_at DESC);

-- 文档同步配置表（单例模式）
CREATE TABLE IF NOT EXISTS docs_sync_config (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  enabled INTEGER NOT NULL DEFAULT 0,
  owner TEXT,
  repo TEXT,
  branch TEXT NOT NULL DEFAULT 'main',
  directory TEXT NOT NULL DEFAULT 'docs',
  image_directory TEXT NOT NULL DEFAULT 'docs/assets',
  auto_sync INTEGER NOT NULL DEFAULT 0
);

-- 提示词优化记录表
CREATE TABLE IF NOT EXISTS prompt_optimizations (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  request TEXT NOT NULL,
  response TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prompt_timestamp ON prompt_optimizations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_favorite ON prompt_optimizations(is_favorite);

-- 语音音色表
CREATE TABLE IF NOT EXISTS voice_speakers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_speakers_created ON voice_speakers(created_at DESC);

-- 语音训练记录表
CREATE TABLE IF NOT EXISTS voice_training_records (
  speaker_id TEXT PRIMARY KEY,
  bv_id TEXT NOT NULL,
  title TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  status INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (speaker_id) REFERENCES voice_speakers(id) ON DELETE CASCADE
);

-- 语音合成记录表
CREATE TABLE IF NOT EXISTS voice_synthesis_records (
  id TEXT PRIMARY KEY,
  speaker_id TEXT NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (speaker_id) REFERENCES voice_speakers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_synthesis_created ON voice_synthesis_records(created_at DESC);

-- 数据迁移状态表
CREATE TABLE IF NOT EXISTS json_migration_status (
  module TEXT PRIMARY KEY,
  migrated_at INTEGER NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0
);
    `
  }
];

/**
 * 获取所有迁移
 */
function loadMigrations(): Migration[] {
  return MIGRATIONS;
}

/**
 * 确保 schema_migrations 表存在
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
}

/**
 * 获取已应用的迁移版本
 */
function getAppliedVersions(db: Database.Database): Set<number> {
  const rows = db
    .prepare('SELECT version FROM schema_migrations')
    .all() as Array<{ version: number }>;
  return new Set(rows.map((r) => r.version));
}

/**
 * 记录迁移已应用
 */
function recordMigration(
  db: Database.Database,
  version: number,
  name: string
): void {
  db.prepare(
    'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
  ).run(version, name, Date.now());
}

/**
 * 运行数据库迁移
 */
export function runMigrations(db: Database.Database): void {
  console.log('[Migrations] Checking for pending migrations...');

  ensureMigrationsTable(db);

  const migrations = loadMigrations();
  const appliedVersions = getAppliedVersions(db);

  const pendingMigrations = migrations.filter(
    (m) => !appliedVersions.has(m.version)
  );

  if (pendingMigrations.length === 0) {
    console.log('[Migrations] No pending migrations');
    return;
  }

  console.log(
    `[Migrations] Found ${pendingMigrations.length} pending migrations`
  );

  for (const migration of pendingMigrations) {
    console.log(
      `[Migrations] Applying migration ${migration.version}: ${migration.name}`
    );

    try {
      // 在事务中执行迁移
      db.transaction(() => {
        db.exec(migration.sql);
        recordMigration(db, migration.version, migration.name);
      })();

      console.log(
        `[Migrations] Successfully applied migration ${migration.version}`
      );
    } catch (error) {
      console.error(
        `[Migrations] Failed to apply migration ${migration.version}:`,
        error
      );
      throw error;
    }
  }

  console.log('[Migrations] All migrations applied successfully');
}

/**
 * 获取当前数据库版本
 */
export function getCurrentVersion(db: Database.Database): number {
  ensureMigrationsTable(db);
  const row = db
    .prepare('SELECT MAX(version) as version FROM schema_migrations')
    .get() as { version: number | null } | undefined;
  return row?.version ?? 0;
}

/**
 * 获取迁移历史
 */
export function getMigrationHistory(
  db: Database.Database
): Array<{ version: number; name: string; appliedAt: number }> {
  ensureMigrationsTable(db);
  const rows = db
    .prepare(
      'SELECT version, name, applied_at as appliedAt FROM schema_migrations ORDER BY version'
    )
    .all() as Array<{ version: number; name: string; appliedAt: number }>;
  return rows;
}
