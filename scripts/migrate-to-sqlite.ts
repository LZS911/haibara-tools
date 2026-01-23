#!/usr/bin/env tsx
/**
 * JSON 数据迁移到 SQLite 脚本
 *
 * 使用方法:
 *   pnpm tsx scripts/migrate-to-sqlite.ts
 *
 * 功能:
 *   - 检测旧 JSON 数据文件
 *   - 将数据迁移到 SQLite 数据库
 *   - 显示迁移进度和结果
 *   - 可选择是否删除旧文件
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// ============ 配置 ============

interface MigrationConfig {
  userDataPath: string;
  databasePath: string;
  deleteOldFiles: boolean;
}

function getConfig(): MigrationConfig {
  // 尝试获取用户数据路径
  let userDataPath = process.env.USER_DATA_PATH;

  if (!userDataPath) {
    // 尝试从 electron-context.json 读取
    const contextPath = path.join(process.cwd(), 'tmp', 'electron-context.json');
    if (fs.existsSync(contextPath)) {
      try {
        const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
        userDataPath = context.userDataPath;
      } catch {
        // 忽略
      }
    }
  }

  if (!userDataPath) {
    // 默认路径
    userDataPath = path.join(process.cwd(), 'tmp');
  }

  return {
    userDataPath,
    databasePath: path.join(userDataPath, 'haibara-tools.db'),
    deleteOldFiles: process.argv.includes('--delete')
  };
}

// ============ 数据库初始化 ============

function initDatabase(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建所有表
  db.exec(`
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

    -- 文档同步配置表
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

    -- 迁移状态表
    CREATE TABLE IF NOT EXISTS json_migration_status (
      module TEXT PRIMARY KEY,
      migrated_at INTEGER NOT NULL,
      record_count INTEGER NOT NULL DEFAULT 0
    );

    -- Schema 迁移表
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  return db;
}

// ============ 辅助函数 ============

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`  ❌ 读取文件失败: ${filePath}`, error);
    return null;
  }
}

function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  🗑️  已删除: ${filePath}`);
    }
  } catch (error) {
    console.error(`  ❌ 删除文件失败: ${filePath}`, error);
  }
}

// ============ 迁移函数 ============

interface MigrationResult {
  module: string;
  success: boolean;
  count: number;
  error?: string;
}

// Git 模块迁移
function migrateGit(
  db: Database.Database,
  basePath: string,
  deleteOld: boolean
): MigrationResult {
  console.log('\n📦 迁移 Git 模块...');

  const reposPath = path.join(basePath, 'git-manager', 'repositories.json');
  const prPath = path.join(basePath, 'git-manager', 'pr-records.json');

  interface GitRepository {
    id: string;
    name: string;
    localPath: string;
    githubOwner: string;
    githubRepo: string;
    defaultBranch: string;
    createdAt: number;
    updatedAt: number;
  }

  interface PRRecord {
    id: number;
    repositoryId: string;
    title: string;
    number: number;
    state: string;
    htmlUrl: string;
    createdAt: string;
    closedAt?: string;
    mergedAt?: string;
    author: string;
    baseBranch: string;
    headBranch: string;
  }

  const repos = readJsonFile<GitRepository[]>(reposPath);
  const prRecords = readJsonFile<PRRecord[]>(prPath);

  if (!repos && !prRecords) {
    console.log('  ⏭️  没有数据需要迁移');
    return { module: 'git', success: true, count: 0 };
  }

  try {
    let count = 0;

    db.transaction(() => {
      if (repos && repos.length > 0) {
        console.log(`  📁 发现 ${repos.length} 个仓库`);
        const insertRepo = db.prepare(`
          INSERT OR REPLACE INTO git_repositories 
          (id, name, local_path, github_owner, github_repo, default_branch, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const repo of repos) {
          insertRepo.run(
            repo.id,
            repo.name,
            repo.localPath,
            repo.githubOwner,
            repo.githubRepo,
            repo.defaultBranch,
            repo.createdAt,
            repo.updatedAt
          );
          count++;
        }
      }

      if (prRecords && prRecords.length > 0) {
        console.log(`  📝 发现 ${prRecords.length} 条 PR 记录`);
        const insertPR = db.prepare(`
          INSERT OR REPLACE INTO git_pr_records 
          (id, repository_id, title, number, state, html_url, created_at, 
           closed_at, merged_at, author, base_branch, head_branch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const pr of prRecords) {
          insertPR.run(
            pr.id,
            pr.repositoryId,
            pr.title,
            pr.number,
            pr.state,
            pr.htmlUrl,
            pr.createdAt,
            pr.closedAt ?? null,
            pr.mergedAt ?? null,
            pr.author,
            pr.baseBranch,
            pr.headBranch
          );
          count++;
        }
      }
    })();

    console.log(`  ✅ 成功迁移 ${count} 条记录`);

    if (deleteOld) {
      deleteFile(reposPath);
      deleteFile(prPath);
    }

    return { module: 'git', success: true, count };
  } catch (error) {
    console.error('  ❌ 迁移失败:', error);
    return { module: 'git', success: false, count: 0, error: String(error) };
  }
}

// Bilibili 模块迁移
function migrateBilibili(
  db: Database.Database,
  basePath: string,
  deleteOld: boolean
): MigrationResult {
  console.log('\n📦 迁移 Bilibili 模块...');

  const historyPath = path.join(
    basePath,
    'bilibili-downloads',
    'bilibili-history.json'
  );

  interface DownloadHistoryItem {
    id: string;
    bvId: string;
    title: string;
    quality: number;
    videoPath?: string;
    audioPath?: string;
    mergedPath?: string;
    coverPath?: string;
    downloadedAt: number;
  }

  const history = readJsonFile<DownloadHistoryItem[]>(historyPath);

  if (!history || history.length === 0) {
    console.log('  ⏭️  没有数据需要迁移');
    return { module: 'bilibili', success: true, count: 0 };
  }

  try {
    console.log(`  📁 发现 ${history.length} 条下载记录`);

    db.transaction(() => {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO bilibili_download_history 
        (id, bv_id, title, quality, video_path, audio_path, merged_path, cover_path, downloaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of history) {
        insert.run(
          item.id,
          item.bvId,
          item.title,
          item.quality,
          item.videoPath ?? null,
          item.audioPath ?? null,
          item.mergedPath ?? null,
          item.coverPath ?? null,
          item.downloadedAt
        );
      }
    })();

    console.log(`  ✅ 成功迁移 ${history.length} 条记录`);

    if (deleteOld) {
      deleteFile(historyPath);
    }

    return { module: 'bilibili', success: true, count: history.length };
  } catch (error) {
    console.error('  ❌ 迁移失败:', error);
    return { module: 'bilibili', success: false, count: 0, error: String(error) };
  }
}

// Docs 模块迁移
function migrateDocs(
  db: Database.Database,
  basePath: string,
  deleteOld: boolean
): MigrationResult {
  console.log('\n📦 迁移 Docs 模块...');

  const docsDir = path.join(basePath, 'docs');
  const indexPath = path.join(docsDir, 'index.json');
  const syncConfigPath = path.join(docsDir, 'sync-config.json');

  interface DocMeta {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    templateId?: string;
    syncedAt?: number;
    githubPath?: string;
    createdAt: number;
    updatedAt: number;
  }

  interface GitHubSyncConfig {
    enabled: boolean;
    owner?: string;
    repo?: string;
    branch: string;
    directory: string;
    imageDirectory: string;
    autoSync: boolean;
  }

  const docIndex = readJsonFile<DocMeta[]>(indexPath);
  const syncConfig = readJsonFile<GitHubSyncConfig>(syncConfigPath);

  if (!docIndex || docIndex.length === 0) {
    console.log('  ⏭️  没有数据需要迁移');
    return { module: 'docs', success: true, count: 0 };
  }

  try {
    console.log(`  📁 发现 ${docIndex.length} 个文档`);

    db.transaction(() => {
      const insertDoc = db.prepare(`
        INSERT OR REPLACE INTO documents 
        (id, title, description, tags, template_id, synced_at, github_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const doc of docIndex) {
        insertDoc.run(
          doc.id,
          doc.title,
          doc.description ?? null,
          JSON.stringify(doc.tags || []),
          doc.templateId ?? null,
          doc.syncedAt ?? null,
          doc.githubPath ?? null,
          doc.createdAt,
          doc.updatedAt
        );
      }

      if (syncConfig) {
        db.prepare(`
          INSERT OR REPLACE INTO docs_sync_config 
          (id, enabled, owner, repo, branch, directory, image_directory, auto_sync)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          syncConfig.enabled ? 1 : 0,
          syncConfig.owner ?? null,
          syncConfig.repo ?? null,
          syncConfig.branch || 'main',
          syncConfig.directory || 'docs',
          syncConfig.imageDirectory || 'docs/assets',
          syncConfig.autoSync ? 1 : 0
        );
      }
    })();

    console.log(`  ✅ 成功迁移 ${docIndex.length} 条记录`);

    if (deleteOld) {
      deleteFile(indexPath);
      deleteFile(syncConfigPath);
    }

    return { module: 'docs', success: true, count: docIndex.length };
  } catch (error) {
    console.error('  ❌ 迁移失败:', error);
    return { module: 'docs', success: false, count: 0, error: String(error) };
  }
}

// PromptOptimizer 模块迁移
function migratePromptOptimizer(
  db: Database.Database,
  basePath: string,
  deleteOld: boolean
): MigrationResult {
  console.log('\n📦 迁移 PromptOptimizer 模块...');

  const historyDir = path.join(basePath, 'prompt-optimizer', 'history');

  if (!fs.existsSync(historyDir)) {
    console.log('  ⏭️  没有数据需要迁移');
    return { module: 'prompt-optimizer', success: true, count: 0 };
  }

  interface OptimizationRecord {
    id: string;
    timestamp: number;
    originalPrompt: string;
    optimizedPrompt: string;
    request: unknown;
    response: unknown;
    isFavorite: boolean;
  }

  try {
    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith('.json'));
    console.log(`  📁 发现 ${files.length} 条优化记录`);

    let count = 0;

    db.transaction(() => {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO prompt_optimizations 
        (id, timestamp, original_prompt, optimized_prompt, request, response, is_favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of files) {
        const record = readJsonFile<OptimizationRecord>(
          path.join(historyDir, file)
        );
        if (record) {
          insert.run(
            record.id,
            record.timestamp,
            record.originalPrompt,
            record.optimizedPrompt,
            JSON.stringify(record.request),
            JSON.stringify(record.response),
            record.isFavorite ? 1 : 0
          );
          count++;
        }
      }
    })();

    console.log(`  ✅ 成功迁移 ${count} 条记录`);

    if (deleteOld) {
      for (const file of files) {
        deleteFile(path.join(historyDir, file));
      }
    }

    return { module: 'prompt-optimizer', success: true, count };
  } catch (error) {
    console.error('  ❌ 迁移失败:', error);
    return {
      module: 'prompt-optimizer',
      success: false,
      count: 0,
      error: String(error)
    };
  }
}

// VoiceCloning 模块迁移
function migrateVoiceCloning(
  db: Database.Database,
  basePath: string,
  deleteOld: boolean
): MigrationResult {
  console.log('\n📦 迁移 VoiceCloning 模块...');

  const voiceDir = path.join(basePath, 'voice-cloning-jobs');
  const speakersPath = path.join(voiceDir, 'speaker-ids.json');
  const trainingPath = path.join(voiceDir, 'training-records.json');
  const synthesisPath = path.join(voiceDir, 'synthesis-records.json');

  interface Speaker {
    id: string;
    name: string;
    createdAt: string;
  }

  interface TrainingRecord {
    speakerId: string;
    bvId: string;
    title: string;
    audioPath: string;
    status: number;
    createdAt: string;
    completedAt?: string;
  }

  interface SynthesisRecord {
    id: string;
    speakerId: string;
    text: string;
    audioUrl: string;
    audioPath: string;
    createdAt: string;
  }

  const speakers = readJsonFile<Speaker[]>(speakersPath);
  const trainings = readJsonFile<TrainingRecord[]>(trainingPath);
  const syntheses = readJsonFile<SynthesisRecord[]>(synthesisPath);

  if (!speakers && !trainings && !syntheses) {
    console.log('  ⏭️  没有数据需要迁移');
    return { module: 'voice-cloning', success: true, count: 0 };
  }

  try {
    let count = 0;

    db.transaction(() => {
      if (speakers && speakers.length > 0) {
        console.log(`  🎤 发现 ${speakers.length} 个音色`);
        const insertSpeaker = db.prepare(`
          INSERT OR REPLACE INTO voice_speakers (id, name, created_at)
          VALUES (?, ?, ?)
        `);
        for (const s of speakers) {
          insertSpeaker.run(s.id, s.name, s.createdAt);
          count++;
        }
      }

      if (trainings && trainings.length > 0) {
        console.log(`  📚 发现 ${trainings.length} 条训练记录`);
        const insertTraining = db.prepare(`
          INSERT OR REPLACE INTO voice_training_records 
          (speaker_id, bv_id, title, audio_path, status, created_at, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of trainings) {
          insertTraining.run(
            t.speakerId,
            t.bvId,
            t.title,
            t.audioPath,
            t.status,
            t.createdAt,
            t.completedAt ?? null
          );
          count++;
        }
      }

      if (syntheses && syntheses.length > 0) {
        console.log(`  🔊 发现 ${syntheses.length} 条合成记录`);
        const insertSynthesis = db.prepare(`
          INSERT OR REPLACE INTO voice_synthesis_records 
          (id, speaker_id, text, audio_url, audio_path, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const s of syntheses) {
          insertSynthesis.run(
            s.id,
            s.speakerId,
            s.text,
            s.audioUrl,
            s.audioPath,
            s.createdAt
          );
          count++;
        }
      }
    })();

    console.log(`  ✅ 成功迁移 ${count} 条记录`);

    if (deleteOld) {
      deleteFile(speakersPath);
      deleteFile(trainingPath);
      deleteFile(synthesisPath);
    }

    return { module: 'voice-cloning', success: true, count };
  } catch (error) {
    console.error('  ❌ 迁移失败:', error);
    return {
      module: 'voice-cloning',
      success: false,
      count: 0,
      error: String(error)
    };
  }
}

// ============ 主函数 ============

function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Haibara Tools - JSON 到 SQLite 迁移    ║');
  console.log('╚════════════════════════════════════════════╝');

  const config = getConfig();

  console.log(`\n📍 用户数据路径: ${config.userDataPath}`);
  console.log(`📍 数据库路径: ${config.databasePath}`);
  console.log(`🗑️  删除旧文件: ${config.deleteOldFiles ? '是' : '否'}`);

  if (!fs.existsSync(config.userDataPath)) {
    console.log('\n⚠️  用户数据目录不存在，无需迁移');
    return;
  }

  console.log('\n🔧 初始化数据库...');
  const db = initDatabase(config.databasePath);
  console.log('✅ 数据库初始化完成');

  const results: MigrationResult[] = [];

  // 执行所有迁移
  results.push(migrateGit(db, config.userDataPath, config.deleteOldFiles));
  results.push(migrateBilibili(db, config.userDataPath, config.deleteOldFiles));
  results.push(migrateDocs(db, config.userDataPath, config.deleteOldFiles));
  results.push(
    migratePromptOptimizer(db, config.userDataPath, config.deleteOldFiles)
  );
  results.push(
    migrateVoiceCloning(db, config.userDataPath, config.deleteOldFiles)
  );

  // 记录迁移状态
  const recordStatus = db.prepare(`
    INSERT OR REPLACE INTO json_migration_status (module, migrated_at, record_count)
    VALUES (?, ?, ?)
  `);

  for (const result of results) {
    if (result.success) {
      recordStatus.run(result.module, Date.now(), result.count);
    }
  }

  // 记录 schema 版本
  db.prepare(`
    INSERT OR REPLACE INTO schema_migrations (version, name, applied_at)
    VALUES (1, 'initial', ?)
  `).run(Date.now());

  db.close();

  // 打印结果
  console.log('\n════════════════════════════════════════════');
  console.log('📊 迁移结果汇总');
  console.log('════════════════════════════════════════════');

  let totalCount = 0;
  let successCount = 0;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.module}: ${result.count} 条记录`);
    totalCount += result.count;
    if (result.success) successCount++;
  }

  console.log('────────────────────────────────────────────');
  console.log(`总计: ${totalCount} 条记录, ${successCount}/${results.length} 模块成功`);
  console.log('════════════════════════════════════════════');

  if (results.every((r) => r.success)) {
    console.log('\n🎉 迁移完成！');
  } else {
    console.log('\n⚠️  部分模块迁移失败，请查看上面的错误信息');
    process.exit(1);
  }
}

main();
