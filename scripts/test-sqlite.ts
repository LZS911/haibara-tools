#!/usr/bin/env tsx
/**
 * 测试 SQLite 数据读取
 */

import Database from 'better-sqlite3';
import path from 'path';

// 直接使用用户数据路径
const userDataPath = '/Users/liyu/Library/Application Support/haibara-tools';
const dbPath = path.join(userDataPath, 'haibara-tools.db');

console.log('📍 数据库路径:', dbPath);

const db = new Database(dbPath);

console.log('\n📊 表数据统计:');

// Git Repositories
const repoCount = db.prepare('SELECT COUNT(*) as count FROM git_repositories').get() as { count: number };
console.log(`git_repositories: ${repoCount.count} 条`);

// Git PR Records
const prCount = db.prepare('SELECT COUNT(*) as count FROM git_pr_records').get() as { count: number };
console.log(`git_pr_records: ${prCount.count} 条`);

// Bilibili
const biliCount = db.prepare('SELECT COUNT(*) as count FROM bilibili_download_history').get() as { count: number };
console.log(`bilibili_download_history: ${biliCount.count} 条`);

// Prompt Optimizer
const promptCount = db.prepare('SELECT COUNT(*) as count FROM prompt_optimizations').get() as { count: number };
console.log(`prompt_optimizations: ${promptCount.count} 条`);

// Voice Speakers
const voiceCount = db.prepare('SELECT COUNT(*) as count FROM voice_speakers').get() as { count: number };
console.log(`voice_speakers: ${voiceCount.count} 条`);

console.log('\n📝 Git 仓库示例数据:');
const repos = db.prepare('SELECT * FROM git_repositories LIMIT 3').all();
console.log(JSON.stringify(repos, null, 2));

db.close();
console.log('\n✅ 测试完成');
