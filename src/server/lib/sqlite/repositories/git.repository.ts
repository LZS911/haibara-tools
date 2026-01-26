import { nanoid } from 'nanoid';
import { BaseRepository } from './base.repository';

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

// 数据库行类型
interface GitRepositoryRow {
  id: string;
  name: string;
  local_path: string;
  github_owner: string;
  github_repo: string;
  default_branch: string;
  created_at: number;
  updated_at: number;
}

interface PRRecordRow {
  id: number;
  repository_id: string;
  title: string;
  number: number;
  state: string;
  html_url: string;
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  author: string;
  base_branch: string;
  head_branch: string;
}

/**
 * Git Repository 数据访问层
 */
class GitRepositoryImpl extends BaseRepository {
  // ============ 仓库操作 ============

  /**
   * 行数据转换为 GitRepository
   */
  private rowToRepository(row: GitRepositoryRow): GitRepository {
    return {
      id: row.id,
      name: row.name,
      localPath: row.local_path,
      githubOwner: row.github_owner,
      githubRepo: row.github_repo,
      defaultBranch: row.default_branch,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 行数据转换为 PRRecord
   */
  private rowToPRRecord(row: PRRecordRow): PRRecord {
    return {
      id: row.id,
      repositoryId: row.repository_id,
      title: row.title,
      number: row.number,
      state: row.state as 'open' | 'closed' | 'merged',
      htmlUrl: row.html_url,
      createdAt: row.created_at,
      closedAt: row.closed_at ?? undefined,
      mergedAt: row.merged_at ?? undefined,
      author: row.author,
      baseBranch: row.base_branch,
      headBranch: row.head_branch
    };
  }

  /**
   * 读取所有仓库
   */
  readRepositories(): GitRepository[] {
    const rows = this.db
      .prepare('SELECT * FROM git_repositories ORDER BY updated_at DESC')
      .all() as GitRepositoryRow[];
    return rows.map((row) => this.rowToRepository(row));
  }

  /**
   * 写入仓库列表（全量替换）
   */
  writeRepositories(repositories: GitRepository[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM git_repositories').run();
      const insert = this.db.prepare(`
        INSERT INTO git_repositories 
        (id, name, local_path, github_owner, github_repo, default_branch, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const repo of repositories) {
        insert.run(
          repo.id,
          repo.name,
          repo.localPath,
          repo.githubOwner,
          repo.githubRepo,
          repo.defaultBranch,
          repo.createdAt,
          repo.updatedAt
        );
      }
    });
  }

  /**
   * 添加仓库
   */
  addRepository(
    repository: Omit<GitRepository, 'id' | 'createdAt' | 'updatedAt'>
  ): GitRepository {
    const now = Date.now();
    const newRepo: GitRepository = {
      id: nanoid(),
      ...repository,
      createdAt: now,
      updatedAt: now
    };

    this.db
      .prepare(
        `
      INSERT INTO git_repositories 
      (id, name, local_path, github_owner, github_repo, default_branch, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        newRepo.id,
        newRepo.name,
        newRepo.localPath,
        newRepo.githubOwner,
        newRepo.githubRepo,
        newRepo.defaultBranch,
        newRepo.createdAt,
        newRepo.updatedAt
      );

    return newRepo;
  }

  /**
   * 更新仓库
   */
  updateRepository(id: string, updates: Partial<GitRepository>): boolean {
    const existing = this.getRepositoryById(id);
    if (!existing) {
      return false;
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    const result = this.db
      .prepare(
        `
      UPDATE git_repositories 
      SET name = ?, local_path = ?, github_owner = ?, github_repo = ?, 
          default_branch = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(
        updated.name,
        updated.localPath,
        updated.githubOwner,
        updated.githubRepo,
        updated.defaultBranch,
        updated.updatedAt,
        id
      );

    return result.changes > 0;
  }

  /**
   * 删除仓库（CASCADE 会自动删除关联的 PR 记录）
   */
  deleteRepository(id: string): boolean {
    const result = this.db
      .prepare('DELETE FROM git_repositories WHERE id = ?')
      .run(id);
    return result.changes > 0;
  }

  /**
   * 获取单个仓库
   */
  getRepositoryById(id: string): GitRepository | undefined {
    const row = this.db
      .prepare('SELECT * FROM git_repositories WHERE id = ?')
      .get(id) as GitRepositoryRow | undefined;
    return row ? this.rowToRepository(row) : undefined;
  }

  // ============ PR 记录操作 ============

  /**
   * 读取所有 PR 记录
   */
  readPRRecords(): PRRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM git_pr_records ORDER BY created_at DESC')
      .all() as PRRecordRow[];
    return rows.map((row) => this.rowToPRRecord(row));
  }

  /**
   * 写入 PR 记录列表（全量替换）
   */
  writePRRecords(records: PRRecord[]): void {
    this.runInTransaction(() => {
      this.db.prepare('DELETE FROM git_pr_records').run();
      const insert = this.db.prepare(`
        INSERT INTO git_pr_records 
        (id, repository_id, title, number, state, html_url, created_at, 
         closed_at, merged_at, author, base_branch, head_branch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const record of records) {
        insert.run(
          record.id,
          record.repositoryId,
          record.title,
          record.number,
          record.state,
          record.htmlUrl,
          record.createdAt,
          record.closedAt ?? null,
          record.mergedAt ?? null,
          record.author,
          record.baseBranch,
          record.headBranch
        );
      }
    });
  }

  /**
   * 添加或更新单个 PR 记录
   */
  upsertPRRecord(record: PRRecord): void {
    this.db
      .prepare(
        `
      INSERT INTO git_pr_records 
      (id, repository_id, title, number, state, html_url, created_at, 
       closed_at, merged_at, author, base_branch, head_branch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(repository_id, id) DO UPDATE SET
        title = excluded.title,
        number = excluded.number,
        state = excluded.state,
        html_url = excluded.html_url,
        created_at = excluded.created_at,
        closed_at = excluded.closed_at,
        merged_at = excluded.merged_at,
        author = excluded.author,
        base_branch = excluded.base_branch,
        head_branch = excluded.head_branch
    `
      )
      .run(
        record.id,
        record.repositoryId,
        record.title,
        record.number,
        record.state,
        record.htmlUrl,
        record.createdAt,
        record.closedAt ?? null,
        record.mergedAt ?? null,
        record.author,
        record.baseBranch,
        record.headBranch
      );
  }

  /**
   * 批量添加或更新 PR 记录
   */
  batchUpsertPRRecords(records: PRRecord[]): void {
    this.batchExecute(records, (record) => this.upsertPRRecord(record));
  }

  /**
   * 获取指定仓库的 PR 记录
   */
  getPRRecordsByRepository(repositoryId: string, limit?: number): PRRecord[] {
    let query =
      'SELECT * FROM git_pr_records WHERE repository_id = ? ORDER BY created_at DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = this.db.prepare(query).all(repositoryId) as PRRecordRow[];
    console.log(rows, '-rows-');
    return rows.map((row) => this.rowToPRRecord(row));
  }

  /**
   * 删除 PR 记录
   */
  deletePRRecord(id: number, repositoryId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM git_pr_records WHERE id = ? AND repository_id = ?')
      .run(id, repositoryId);
    return result.changes > 0;
  }

  /**
   * 清空所有 PR 记录
   */
  clearPRRecords(): boolean {
    try {
      this.db.prepare('DELETE FROM git_pr_records').run();
      return true;
    } catch (error) {
      console.error('清空 PR 记录失败:', error);
      return false;
    }
  }

  /**
   * 根据时间范围获取 PR 记录
   */
  getPRRecordsByTimeRange(
    repositoryIds: string[],
    startTime: string,
    endTime: string
  ): PRRecord[] {
    let query = `
      SELECT * FROM git_pr_records 
      WHERE created_at >= ? AND created_at <= ?
    `;

    const params: (string | number)[] = [startTime, endTime];

    if (repositoryIds.length > 0) {
      const placeholders = repositoryIds.map(() => '?').join(', ');
      query += ` AND repository_id IN (${placeholders})`;
      params.push(...repositoryIds);
    }

    query += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(query).all(...params) as PRRecordRow[];
    return rows.map((row) => this.rowToPRRecord(row));
  }
}

// 导出单例实例
export const gitRepository = new GitRepositoryImpl();

// 导出兼容的函数接口（使用箭头函数保持 this 绑定）
export const readRepositories = () => gitRepository.readRepositories();
export const writeRepositories = (repositories: GitRepository[]) =>
  gitRepository.writeRepositories(repositories);
export const addRepository = (
  repository: Omit<GitRepository, 'id' | 'createdAt' | 'updatedAt'>
) => gitRepository.addRepository(repository);
export const updateRepository = (id: string, updates: Partial<GitRepository>) =>
  gitRepository.updateRepository(id, updates);
export const deleteRepository = (id: string) =>
  gitRepository.deleteRepository(id);
export const getRepositoryById = (id: string) =>
  gitRepository.getRepositoryById(id);
export const readPRRecords = () => gitRepository.readPRRecords();
export const writePRRecords = (records: PRRecord[]) =>
  gitRepository.writePRRecords(records);
export const upsertPRRecord = (record: PRRecord) =>
  gitRepository.upsertPRRecord(record);
export const batchUpsertPRRecords = (records: PRRecord[]) =>
  gitRepository.batchUpsertPRRecords(records);
export const getPRRecordsByRepository = (
  repositoryId: string,
  limit?: number
) => gitRepository.getPRRecordsByRepository(repositoryId, limit);
export const deletePRRecord = (id: number, repositoryId: string) =>
  gitRepository.deletePRRecord(id, repositoryId);
export const clearPRRecords = () => gitRepository.clearPRRecords();
export const getPRRecordsByTimeRange = (
  repositoryIds: string[],
  startTime: string,
  endTime: string
) => gitRepository.getPRRecordsByTimeRange(repositoryIds, startTime, endTime);
