import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { getUserDataPath } from '../lib/config';

// 定义类型
export interface GitRepository {
  id: string;
  name: string;
  localPath: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  createdAt: number;
  updatedAt: number;
}

export interface PRRecord {
  id: number;
  repositoryId: string;
  title: string;
  number: number;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  createdAt: string;
  closedAt?: string;
  mergedAt?: string;
  author: string;
  baseBranch: string;
  headBranch: string;
}

// 获取存储目录路径
function getStorageDir(): string {
  const baseDir = getUserDataPath();
  if (!baseDir) {
    return path.join(process.cwd(), 'tmp', 'git-manager');
  }
  return path.join(baseDir, 'git-manager');
}

// 确保目录存在
function ensureDirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 获取仓库文件路径
function getRepositoriesFilePath(): string {
  return path.join(getStorageDir(), 'repositories.json');
}

// 获取 PR 记录文件路径
function getPRRecordsFilePath(): string {
  return path.join(getStorageDir(), 'pr-records.json');
}

// 读取仓库列表
export function readRepositories(): GitRepository[] {
  try {
    const filePath = getRepositoriesFilePath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as GitRepository[];
  } catch (error) {
    console.error('读取仓库列表失败:', error);
    return [];
  }
}

// 写入仓库列表
export function writeRepositories(repositories: GitRepository[]): void {
  try {
    const filePath = getRepositoriesFilePath();
    const dir = path.dirname(filePath);
    ensureDirSync(dir);
    fs.writeFileSync(filePath, JSON.stringify(repositories, null, 2), 'utf-8');
  } catch (error) {
    console.error('写入仓库列表失败:', error);
  }
}

// 添加仓库
export function addRepository(
  repository: Omit<GitRepository, 'id' | 'createdAt' | 'updatedAt'>
): GitRepository {
  const repositories = readRepositories();
  const now = Date.now();
  const newRepo: GitRepository = {
    id: nanoid(),
    ...repository,
    createdAt: now,
    updatedAt: now
  };
  repositories.push(newRepo);
  writeRepositories(repositories);
  return newRepo;
}

// 更新仓库
export function updateRepository(
  id: string,
  updates: Partial<GitRepository>
): boolean {
  const repositories = readRepositories();
  const index = repositories.findIndex((repo) => repo.id === id);

  if (index === -1) {
    return false;
  }

  repositories[index] = {
    ...repositories[index],
    ...updates,
    updatedAt: Date.now()
  };
  writeRepositories(repositories);
  return true;
}

// 删除仓库
export function deleteRepository(id: string): boolean {
  const repositories = readRepositories();
  const index = repositories.findIndex((repo) => repo.id === id);

  if (index === -1) {
    return false;
  }

  repositories.splice(index, 1);
  writeRepositories(repositories);

  // 同时删除关联的 PR 记录
  const prRecords = readPRRecords();
  const filteredRecords = prRecords.filter(
    (record) => record.repositoryId !== id
  );
  writePRRecords(filteredRecords);

  return true;
}

// 获取单个仓库
export function getRepositoryById(id: string): GitRepository | undefined {
  const repositories = readRepositories();
  return repositories.find((repo) => repo.id === id);
}

// 读取 PR 记录
export function readPRRecords(): PRRecord[] {
  try {
    const filePath = getPRRecordsFilePath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as PRRecord[];
  } catch (error) {
    console.error('读取 PR 记录失败:', error);
    return [];
  }
}

// 写入 PR 记录
export function writePRRecords(records: PRRecord[]): void {
  try {
    const filePath = getPRRecordsFilePath();
    const dir = path.dirname(filePath);
    ensureDirSync(dir);
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('写入 PR 记录失败:', error);
  }
}

// 添加或更新 PR 记录
export function upsertPRRecord(record: PRRecord): void {
  const records = readPRRecords();
  const index = records.findIndex(
    (r) => r.id === record.id && r.repositoryId === record.repositoryId
  );

  if (index === -1) {
    records.push(record);
  } else {
    records[index] = record;
  }

  writePRRecords(records);
}

// 批量添加或更新 PR 记录
export function batchUpsertPRRecords(records: PRRecord[]): void {
  const existingRecords = readPRRecords();
  const recordMap = new Map(
    existingRecords.map((r) => [`${r.repositoryId}-${r.id}`, r])
  );

  records.forEach((record) => {
    recordMap.set(`${record.repositoryId}-${record.id}`, record);
  });

  writePRRecords(Array.from(recordMap.values()));
}

// 获取指定仓库的 PR 记录
export function getPRRecordsByRepository(repositoryId: string): PRRecord[] {
  const records = readPRRecords();
  return records.filter((record) => record.repositoryId === repositoryId);
}

// 删除 PR 记录
export function deletePRRecord(id: number, repositoryId: string): boolean {
  const records = readPRRecords();
  const index = records.findIndex(
    (r) => r.id === id && r.repositoryId === repositoryId
  );

  if (index === -1) {
    return false;
  }

  records.splice(index, 1);
  writePRRecords(records);
  return true;
}

// 清空所有 PR 记录
export function clearPRRecords(): boolean {
  try {
    writePRRecords([]);
    return true;
  } catch (error) {
    console.error('清空 PR 记录失败:', error);
    return false;
  }
}

// 根据时间范围获取 PR 记录
export function getPRRecordsByTimeRange(
  repositoryIds: string[],
  startTime: string,
  endTime: string
): PRRecord[] {
  const records = readPRRecords();
  return records.filter((record) => {
    if (
      repositoryIds.length > 0 &&
      !repositoryIds.includes(record.repositoryId)
    ) {
      return false;
    }
    const createdAt = new Date(record.createdAt).getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return createdAt >= start && createdAt <= end;
  });
}
