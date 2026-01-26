import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { BaseRepository } from './base.repository';
import { getUserDataPath } from '../../config';
import type {
  DocMeta,
  Document,
  DocListItem,
  GitHubSyncConfig,
  CreateDocInput,
  UpdateDocInput
} from '@/types/docs';

// 数据库行类型
interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  tags: string;
  template_id: string | null;
  synced_at: number | null;
  github_path: string | null;
  created_at: number;
  updated_at: number;
}

interface SyncConfigRow {
  id: number;
  enabled: number;
  owner: string | null;
  repo: string | null;
  branch: string;
  directory: string;
  image_directory: string;
  auto_sync: number;
}

// 获取文档存储根目录
function getDocsDir(): string {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, 'docs');
  }
  return path.join(process.cwd(), 'userData', 'docs');
}

// 获取单个文档目录路径
function getDocDir(docId: string): string {
  return path.join(getDocsDir(), docId);
}

// 获取文档内容文件路径
function getDocContentPath(docId: string): string {
  return path.join(getDocDir(docId), 'content.md');
}

// 获取文档资源目录路径
function getDocAssetsDir(docId: string): string {
  return path.join(getDocDir(docId), 'assets');
}

// 确保目录存在
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 文档管理 Repository
 */
class DocsRepositoryImpl extends BaseRepository {
  /**
   * 行数据转换为 DocMeta
   */
  private rowToMeta(row: DocumentRow): DocMeta {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: JSON.parse(row.tags) as string[],
      templateId: row.template_id ?? undefined,
      syncedAt: row.synced_at ?? undefined,
      githubPath: row.github_path ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ============ 文档 CRUD 操作 ============

  /**
   * 获取文档列表
   */
  listDocs(): DocListItem[] {
    const rows = this.db
      .prepare('SELECT * FROM documents ORDER BY updated_at DESC')
      .all() as DocumentRow[];
    return rows.map((row) => this.rowToMeta(row));
  }

  /**
   * 获取单个文档
   */
  getDoc(id: string): Document | null {
    const row = this.db
      .prepare('SELECT * FROM documents WHERE id = ?')
      .get(id) as DocumentRow | undefined;

    if (!row) {
      return null;
    }

    const contentPath = getDocContentPath(id);
    if (!fs.existsSync(contentPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(contentPath, 'utf-8');
      return { meta: this.rowToMeta(row), content };
    } catch {
      return null;
    }
  }

  /**
   * 创建文档
   */
  createDoc(input: CreateDocInput): Document {
    const id = nanoid(10);
    const now = Date.now();

    const meta: DocMeta = {
      id,
      title: input.title,
      description: input.description,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      templateId: input.templateId
    };

    // 创建文档目录结构
    const docDir = getDocDir(id);
    ensureDir(docDir);
    ensureDir(getDocAssetsDir(id));

    // 写入内容文件
    fs.writeFileSync(getDocContentPath(id), input.content || '', 'utf-8');

    // 插入数据库
    this.db
      .prepare(
        `
      INSERT INTO documents 
      (id, title, description, tags, template_id, synced_at, github_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        meta.id,
        meta.title,
        meta.description ?? null,
        JSON.stringify(meta.tags),
        meta.templateId ?? null,
        meta.syncedAt ?? null,
        meta.githubPath ?? null,
        meta.createdAt,
        meta.updatedAt
      );

    return { meta, content: input.content || '' };
  }

  /**
   * 更新文档
   */
  updateDoc(input: UpdateDocInput): Document | null {
    const existing = this.getDoc(input.id);
    if (!existing) {
      return null;
    }

    const now = Date.now();
    const updatedMeta: DocMeta = {
      ...existing.meta,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description
      }),
      ...(input.tags !== undefined && { tags: input.tags }),
      updatedAt: now
    };

    const updatedContent =
      input.content !== undefined ? input.content : existing.content;

    // 写入内容文件
    fs.writeFileSync(getDocContentPath(input.id), updatedContent, 'utf-8');

    // 更新数据库
    this.db
      .prepare(
        `
      UPDATE documents 
      SET title = ?, description = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(
        updatedMeta.title,
        updatedMeta.description ?? null,
        JSON.stringify(updatedMeta.tags),
        updatedMeta.updatedAt,
        input.id
      );

    return { meta: updatedMeta, content: updatedContent };
  }

  /**
   * 删除文档
   */
  deleteDoc(id: string): boolean {
    const docDir = getDocDir(id);

    // 从数据库删除
    const result = this.db
      .prepare('DELETE FROM documents WHERE id = ?')
      .run(id);

    if (result.changes === 0) {
      return false;
    }

    // 删除文件系统中的文档目录
    if (fs.existsSync(docDir)) {
      try {
        fs.rmSync(docDir, { recursive: true, force: true });
      } catch {
        // 忽略文件删除错误
      }
    }

    return true;
  }

  // ============ 图片资源操作 ============

  /**
   * 保存图片到文档资源目录
   */
  saveDocAsset(docId: string, fileName: string, data: Buffer): string {
    const assetsDir = getDocAssetsDir(docId);
    ensureDir(assetsDir);

    // 生成唯一文件名
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueName = `${baseName}-${nanoid(6)}${ext}`;
    const filePath = path.join(assetsDir, uniqueName);

    fs.writeFileSync(filePath, data);

    // 返回相对路径（用于 Markdown 引用）
    return `assets/${uniqueName}`;
  }

  /**
   * 获取文档资源的绝对路径
   */
  getDocAssetPath(docId: string, relativePath: string): string {
    return path.join(getDocDir(docId), relativePath);
  }

  /**
   * 列出文档的所有资源
   */
  listDocAssets(docId: string): string[] {
    const assetsDir = getDocAssetsDir(docId);
    if (!fs.existsSync(assetsDir)) {
      return [];
    }

    return fs.readdirSync(assetsDir);
  }

  /**
   * 删除文档资源
   */
  deleteDocAsset(docId: string, fileName: string): boolean {
    const filePath = path.join(getDocAssetsDir(docId), fileName);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ============ GitHub 同步配置操作 ============

  /**
   * 获取同步配置
   */
  getSyncConfig(): GitHubSyncConfig {
    const row = this.db
      .prepare('SELECT * FROM docs_sync_config WHERE id = 1')
      .get() as SyncConfigRow | undefined;

    if (!row) {
      return {
        enabled: false,
        branch: 'main',
        directory: 'docs',
        imageDirectory: 'docs/assets',
        autoSync: false
      };
    }

    return {
      enabled: row.enabled === 1,
      owner: row.owner ?? undefined,
      repo: row.repo ?? undefined,
      branch: row.branch,
      directory: row.directory,
      imageDirectory: row.image_directory,
      autoSync: row.auto_sync === 1
    };
  }

  /**
   * 保存同步配置
   */
  saveSyncConfig(config: GitHubSyncConfig): void {
    this.db
      .prepare(
        `
      INSERT INTO docs_sync_config 
      (id, enabled, owner, repo, branch, directory, image_directory, auto_sync)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        owner = excluded.owner,
        repo = excluded.repo,
        branch = excluded.branch,
        directory = excluded.directory,
        image_directory = excluded.image_directory,
        auto_sync = excluded.auto_sync
    `
      )
      .run(
        config.enabled ? 1 : 0,
        config.owner ?? null,
        config.repo ?? null,
        config.branch,
        config.directory,
        config.imageDirectory,
        config.autoSync ? 1 : 0
      );
  }

  /**
   * 更新文档的同步状态
   */
  updateDocSyncStatus(docId: string, githubPath: string): Document | null {
    const existing = this.getDoc(docId);
    if (!existing) {
      return null;
    }

    const now = Date.now();

    this.db
      .prepare(
        `
      UPDATE documents 
      SET synced_at = ?, github_path = ?
      WHERE id = ?
    `
      )
      .run(now, githubPath, docId);

    return this.getDoc(docId);
  }

  // ============ 搜索功能 ============

  /**
   * 简单的全文搜索
   */
  searchDocs(query: string, limit = 10): DocListItem[] {
    const docs = this.listDocs();
    const queryLower = query.toLowerCase();

    const results: Array<{ doc: DocListItem; score: number }> = [];

    for (const docMeta of docs) {
      let score = 0;

      // 标题匹配权重最高
      if (docMeta.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // 描述匹配
      if (docMeta.description?.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // 标签匹配
      if (docMeta.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
        score += 3;
      }

      // 内容匹配
      const doc = this.getDoc(docMeta.id);
      if (doc && doc.content.toLowerCase().includes(queryLower)) {
        score += 1;
      }

      if (score > 0) {
        results.push({ doc: docMeta, score });
      }
    }

    // 按分数排序并返回
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.doc);
  }

  /**
   * 获取文档内容片段（用于搜索结果展示）
   */
  getDocSnippet(docId: string, query: string, length = 150): string {
    const doc = this.getDoc(docId);
    if (!doc) {
      return '';
    }

    const content = doc.content;
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      // 如果没找到匹配，返回开头内容
      return content.slice(0, length) + (content.length > length ? '...' : '');
    }

    // 返回匹配位置周围的内容
    const start = Math.max(0, index - Math.floor(length / 2));
    const end = Math.min(content.length, start + length);
    const snippet = content.slice(start, end);

    return (
      (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '')
    );
  }

  // ============ 旧索引兼容操作 ============

  /**
   * 读取文档索引（兼容旧接口）
   */
  readDocIndex(): DocListItem[] {
    return this.listDocs();
  }
}

// 导出单例实例
export const docsRepository = new DocsRepositoryImpl();

// 导出兼容的函数接口（使用箭头函数保持 this 绑定）
export const listDocs = () => docsRepository.listDocs();
export const getDoc = (id: string) => docsRepository.getDoc(id);
export const createDoc = (input: CreateDocInput) =>
  docsRepository.createDoc(input);
export const updateDoc = (input: UpdateDocInput) =>
  docsRepository.updateDoc(input);
export const deleteDoc = (id: string) => docsRepository.deleteDoc(id);
export const saveDocAsset = (docId: string, fileName: string, data: Buffer) =>
  docsRepository.saveDocAsset(docId, fileName, data);
export const getDocAssetPath = (docId: string, relativePath: string) =>
  docsRepository.getDocAssetPath(docId, relativePath);
export const listDocAssets = (docId: string) =>
  docsRepository.listDocAssets(docId);
export const deleteDocAsset = (docId: string, fileName: string) =>
  docsRepository.deleteDocAsset(docId, fileName);
export const getSyncConfig = () => docsRepository.getSyncConfig();
export const saveSyncConfig = (config: GitHubSyncConfig) =>
  docsRepository.saveSyncConfig(config);
export const updateDocSyncStatus = (docId: string, githubPath: string) =>
  docsRepository.updateDocSyncStatus(docId, githubPath);
export const searchDocs = (query: string, limit?: number) =>
  docsRepository.searchDocs(query, limit);
export const getDocSnippet = (docId: string, query: string, length?: number) =>
  docsRepository.getDocSnippet(docId, query, length);
export const readDocIndex = () => docsRepository.readDocIndex();
