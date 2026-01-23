import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';
import { getUserDataPath } from '../config';
import type { GitRepository, PRRecord } from './repositories/git.repository';
import type { DownloadHistoryItem } from './repositories/bilibili.repository';
import type { DocMeta, GitHubSyncConfig } from '@/types/docs';
import type { OptimizationRecord } from '@/types/prompt-optimizer';
import type {
  Speaker,
  TrainingRecord,
  SynthesisRecord
} from '@/types/voice-cloning';

interface MigrationResult {
  module: string;
  success: boolean;
  recordCount: number;
  error?: string;
}

/**
 * 检查模块是否已迁移
 */
function isModuleMigrated(module: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare('SELECT module FROM json_migration_status WHERE module = ?')
    .get(module);
  return !!row;
}

/**
 * 记录模块迁移完成
 */
function recordMigration(module: string, recordCount: number): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT OR REPLACE INTO json_migration_status (module, migrated_at, record_count)
    VALUES (?, ?, ?)
  `
  ).run(module, Date.now(), recordCount);
}

/**
 * 获取基础路径
 */
function getBasePath(): string {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return userDataPath;
  }
  return path.join(process.cwd(), 'tmp');
}

/**
 * 安全读取 JSON 文件
 */
function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`[Migration] Failed to read ${filePath}:`, error);
    return null;
  }
}

// ============ Git 模块迁移 ============

function migrateGit(): MigrationResult {
  const module = 'git';
  if (isModuleMigrated(module)) {
    console.log(`[Migration] ${module} already migrated, skipping`);
    return { module, success: true, recordCount: 0 };
  }

  const basePath = getBasePath();
  const reposPath = path.join(basePath, 'git-manager', 'repositories.json');
  const prPath = path.join(basePath, 'git-manager', 'pr-records.json');

  const repos = readJsonFile<GitRepository[]>(reposPath);
  const prRecords = readJsonFile<PRRecord[]>(prPath);

  if (!repos && !prRecords) {
    console.log(`[Migration] ${module}: No data to migrate`);
    recordMigration(module, 0);
    return { module, success: true, recordCount: 0 };
  }

  try {
    const db = getDatabase();
    let count = 0;

    db.transaction(() => {
      if (repos && repos.length > 0) {
        const insertRepo = db.prepare(`
          INSERT OR IGNORE INTO git_repositories 
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
        const insertPR = db.prepare(`
          INSERT OR IGNORE INTO git_pr_records 
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

    recordMigration(module, count);
    console.log(`[Migration] ${module}: Migrated ${count} records`);
    return { module, success: true, recordCount: count };
  } catch (error) {
    console.error(`[Migration] ${module} failed:`, error);
    return {
      module,
      success: false,
      recordCount: 0,
      error: String(error)
    };
  }
}

// ============ Bilibili 模块迁移 ============

function migrateBilibili(): MigrationResult {
  const module = 'bilibili';
  if (isModuleMigrated(module)) {
    console.log(`[Migration] ${module} already migrated, skipping`);
    return { module, success: true, recordCount: 0 };
  }

  const basePath = getBasePath();
  const historyPath = path.join(
    basePath,
    'bilibili-downloads',
    'bilibili-history.json'
  );
  const history = readJsonFile<DownloadHistoryItem[]>(historyPath);

  if (!history || history.length === 0) {
    console.log(`[Migration] ${module}: No data to migrate`);
    recordMigration(module, 0);
    return { module, success: true, recordCount: 0 };
  }

  try {
    const db = getDatabase();

    db.transaction(() => {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO bilibili_download_history 
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

    recordMigration(module, history.length);
    console.log(`[Migration] ${module}: Migrated ${history.length} records`);
    return { module, success: true, recordCount: history.length };
  } catch (error) {
    console.error(`[Migration] ${module} failed:`, error);
    return {
      module,
      success: false,
      recordCount: 0,
      error: String(error)
    };
  }
}

// ============ Docs 模块迁移 ============

function migrateDocs(): MigrationResult {
  const module = 'docs';
  if (isModuleMigrated(module)) {
    console.log(`[Migration] ${module} already migrated, skipping`);
    return { module, success: true, recordCount: 0 };
  }

  const basePath = getBasePath();
  const docsDir = path.join(basePath, 'docs');
  const indexPath = path.join(docsDir, 'index.json');
  const syncConfigPath = path.join(docsDir, 'sync-config.json');

  const docIndex = readJsonFile<DocMeta[]>(indexPath);
  const syncConfig = readJsonFile<GitHubSyncConfig>(syncConfigPath);

  if (!docIndex || docIndex.length === 0) {
    console.log(`[Migration] ${module}: No data to migrate`);
    recordMigration(module, 0);
    return { module, success: true, recordCount: 0 };
  }

  try {
    const db = getDatabase();
    let count = 0;

    db.transaction(() => {
      // 迁移文档索引
      const insertDoc = db.prepare(`
        INSERT OR IGNORE INTO documents 
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
        count++;
      }

      // 迁移同步配置
      if (syncConfig) {
        db.prepare(
          `
          INSERT OR REPLACE INTO docs_sync_config 
          (id, enabled, owner, repo, branch, directory, image_directory, auto_sync)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
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

    recordMigration(module, count);
    console.log(`[Migration] ${module}: Migrated ${count} records`);
    return { module, success: true, recordCount: count };
  } catch (error) {
    console.error(`[Migration] ${module} failed:`, error);
    return {
      module,
      success: false,
      recordCount: 0,
      error: String(error)
    };
  }
}

// ============ PromptOptimizer 模块迁移 ============

function migratePromptOptimizer(): MigrationResult {
  const module = 'prompt-optimizer';
  if (isModuleMigrated(module)) {
    console.log(`[Migration] ${module} already migrated, skipping`);
    return { module, success: true, recordCount: 0 };
  }

  const basePath = getBasePath();
  const historyDir = path.join(basePath, 'prompt-optimizer', 'history');

  if (!fs.existsSync(historyDir)) {
    console.log(`[Migration] ${module}: No data to migrate`);
    recordMigration(module, 0);
    return { module, success: true, recordCount: 0 };
  }

  try {
    const db = getDatabase();
    let count = 0;

    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith('.json'));

    db.transaction(() => {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO prompt_optimizations 
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

    recordMigration(module, count);
    console.log(`[Migration] ${module}: Migrated ${count} records`);
    return { module, success: true, recordCount: count };
  } catch (error) {
    console.error(`[Migration] ${module} failed:`, error);
    return {
      module,
      success: false,
      recordCount: 0,
      error: String(error)
    };
  }
}

// ============ VoiceCloning 模块迁移 ============

function migrateVoiceCloning(): MigrationResult {
  const module = 'voice-cloning';
  if (isModuleMigrated(module)) {
    console.log(`[Migration] ${module} already migrated, skipping`);
    return { module, success: true, recordCount: 0 };
  }

  const basePath = getBasePath();
  const voiceDir = path.join(basePath, 'voice-cloning-jobs');
  const speakersPath = path.join(voiceDir, 'speaker-ids.json');
  const trainingPath = path.join(voiceDir, 'training-records.json');
  const synthesisPath = path.join(voiceDir, 'synthesis-records.json');

  const speakers = readJsonFile<Speaker[]>(speakersPath);
  const trainings = readJsonFile<TrainingRecord[]>(trainingPath);
  const syntheses = readJsonFile<SynthesisRecord[]>(synthesisPath);

  if (!speakers && !trainings && !syntheses) {
    console.log(`[Migration] ${module}: No data to migrate`);
    recordMigration(module, 0);
    return { module, success: true, recordCount: 0 };
  }

  try {
    const db = getDatabase();
    let count = 0;

    db.transaction(() => {
      if (speakers && speakers.length > 0) {
        const insertSpeaker = db.prepare(`
          INSERT OR IGNORE INTO voice_speakers (id, name, created_at)
          VALUES (?, ?, ?)
        `);
        for (const s of speakers) {
          insertSpeaker.run(s.id, s.name, s.createdAt);
          count++;
        }
      }

      if (trainings && trainings.length > 0) {
        const insertTraining = db.prepare(`
          INSERT OR IGNORE INTO voice_training_records 
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
        const insertSynthesis = db.prepare(`
          INSERT OR IGNORE INTO voice_synthesis_records 
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

    recordMigration(module, count);
    console.log(`[Migration] ${module}: Migrated ${count} records`);
    return { module, success: true, recordCount: count };
  } catch (error) {
    console.error(`[Migration] ${module} failed:`, error);
    return {
      module,
      success: false,
      recordCount: 0,
      error: String(error)
    };
  }
}

// ============ 主迁移函数 ============

/**
 * 执行所有 JSON 数据迁移
 */
export function migrateFromJson(): MigrationResult[] {
  console.log('[Migration] Starting JSON to SQLite migration...');

  const results: MigrationResult[] = [];

  // 按顺序迁移各模块
  results.push(migrateGit());
  results.push(migrateBilibili());
  results.push(migrateDocs());
  results.push(migratePromptOptimizer());
  results.push(migrateVoiceCloning());

  const successCount = results.filter((r) => r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);

  console.log(
    `[Migration] Completed: ${successCount}/${results.length} modules, ${totalRecords} total records`
  );

  return results;
}

/**
 * 获取迁移状态
 */
export function getMigrationStatus(): Array<{
  module: string;
  migratedAt: number;
  recordCount: number;
}> {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT module, migrated_at as migratedAt, record_count as recordCount FROM json_migration_status'
    )
    .all() as Array<{
    module: string;
    migratedAt: number;
    recordCount: number;
  }>;
}

/**
 * 重置迁移状态（用于重新迁移）
 */
export function resetMigrationStatus(module?: string): void {
  const db = getDatabase();
  if (module) {
    db.prepare('DELETE FROM json_migration_status WHERE module = ?').run(
      module
    );
  } else {
    db.prepare('DELETE FROM json_migration_status').run();
  }
}
