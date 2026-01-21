import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import type {
  DocMeta,
  Document,
  DocListItem,
  GitHubSyncConfig,
  CreateDocInput,
  UpdateDocInput
} from '@/types/docs';

// 获取用户数据目录
function getUserDataPath(): string {
  const userDataPath =
    process.env.USER_DATA_PATH ||
    (process.env.NODE_ENV === 'development'
      ? path.join(process.cwd(), 'userData')
      : path.join(
          process.env.APPDATA || process.env.HOME || process.cwd(),
          '.haibara-tools'
        ));
  return userDataPath;
}

// 获取文档存储根目录
function getDocsDir(): string {
  return path.join(getUserDataPath(), 'docs');
}

// 获取文档索引文件路径
function getIndexPath(): string {
  return path.join(getDocsDir(), 'index.json');
}

// 获取同步配置文件路径
function getSyncConfigPath(): string {
  return path.join(getDocsDir(), 'sync-config.json');
}

// 获取单个文档目录路径
function getDocDir(docId: string): string {
  return path.join(getDocsDir(), docId);
}

// 获取文档内容文件路径
function getDocContentPath(docId: string): string {
  return path.join(getDocDir(docId), 'content.md');
}

// 获取文档元数据文件路径
function getDocMetaPath(docId: string): string {
  return path.join(getDocDir(docId), 'meta.json');
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

// 确保文档存储目录结构存在
function ensureDocsStructure(): void {
  ensureDir(getDocsDir());
  const indexPath = getIndexPath();
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

// ============ 文档索引操作 ============

// 读取文档索引
export function readDocIndex(): DocListItem[] {
  ensureDocsStructure();
  try {
    const content = fs.readFileSync(getIndexPath(), 'utf-8');
    return JSON.parse(content) as DocListItem[];
  } catch {
    return [];
  }
}

// 写入文档索引
function writeDocIndex(index: DocListItem[]): void {
  ensureDocsStructure();
  fs.writeFileSync(getIndexPath(), JSON.stringify(index, null, 2), 'utf-8');
}

// 更新文档索引中的单个文档
function updateDocInIndex(docMeta: DocMeta): void {
  const index = readDocIndex();
  const existingIndex = index.findIndex((d) => d.id === docMeta.id);
  if (existingIndex >= 0) {
    index[existingIndex] = docMeta;
  } else {
    index.push(docMeta);
  }
  writeDocIndex(index);
}

// 从索引中删除文档
function removeDocFromIndex(docId: string): void {
  const index = readDocIndex();
  const newIndex = index.filter((d) => d.id !== docId);
  writeDocIndex(newIndex);
}

// ============ 文档 CRUD 操作 ============

// 获取文档列表
export function listDocs(): DocListItem[] {
  return readDocIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

// 获取单个文档
export function getDoc(id: string): Document | null {
  const metaPath = getDocMetaPath(id);
  const contentPath = getDocContentPath(id);

  if (!fs.existsSync(metaPath) || !fs.existsSync(contentPath)) {
    return null;
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as DocMeta;
    const content = fs.readFileSync(contentPath, 'utf-8');
    return { meta, content };
  } catch {
    return null;
  }
}

// 创建文档
export function createDoc(input: CreateDocInput): Document {
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

  const docDir = getDocDir(id);
  ensureDir(docDir);
  ensureDir(getDocAssetsDir(id));

  // 写入元数据
  fs.writeFileSync(getDocMetaPath(id), JSON.stringify(meta, null, 2), 'utf-8');

  // 写入内容
  fs.writeFileSync(getDocContentPath(id), input.content || '', 'utf-8');

  // 更新索引
  updateDocInIndex(meta);

  return { meta, content: input.content || '' };
}

// 更新文档
export function updateDoc(input: UpdateDocInput): Document | null {
  const existing = getDoc(input.id);
  if (!existing) {
    return null;
  }

  const now = Date.now();
  const updatedMeta: DocMeta = {
    ...existing.meta,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.tags !== undefined && { tags: input.tags }),
    updatedAt: now
  };

  const updatedContent =
    input.content !== undefined ? input.content : existing.content;

  // 写入元数据
  fs.writeFileSync(
    getDocMetaPath(input.id),
    JSON.stringify(updatedMeta, null, 2),
    'utf-8'
  );

  // 写入内容
  fs.writeFileSync(getDocContentPath(input.id), updatedContent, 'utf-8');

  // 更新索引
  updateDocInIndex(updatedMeta);

  return { meta: updatedMeta, content: updatedContent };
}

// 删除文档
export function deleteDoc(id: string): boolean {
  const docDir = getDocDir(id);
  if (!fs.existsSync(docDir)) {
    return false;
  }

  try {
    // 递归删除文档目录
    fs.rmSync(docDir, { recursive: true, force: true });
    // 从索引中删除
    removeDocFromIndex(id);
    return true;
  } catch {
    return false;
  }
}

// ============ 图片资源操作 ============

// 保存图片到文档资源目录
export function saveDocAsset(
  docId: string,
  fileName: string,
  data: Buffer
): string {
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

// 获取文档资源的绝对路径
export function getDocAssetPath(docId: string, relativePath: string): string {
  return path.join(getDocDir(docId), relativePath);
}

// 列出文档的所有资源
export function listDocAssets(docId: string): string[] {
  const assetsDir = getDocAssetsDir(docId);
  if (!fs.existsSync(assetsDir)) {
    return [];
  }

  return fs.readdirSync(assetsDir);
}

// 删除文档资源
export function deleteDocAsset(docId: string, fileName: string): boolean {
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

// 获取同步配置
export function getSyncConfig(): GitHubSyncConfig {
  ensureDocsStructure();
  const configPath = getSyncConfigPath();

  if (!fs.existsSync(configPath)) {
    return {
      enabled: false,
      branch: 'main',
      directory: 'docs',
      imageDirectory: 'docs/assets',
      autoSync: false
    };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as GitHubSyncConfig;
  } catch {
    return {
      enabled: false,
      branch: 'main',
      directory: 'docs',
      imageDirectory: 'docs/assets',
      autoSync: false
    };
  }
}

// 保存同步配置
export function saveSyncConfig(config: GitHubSyncConfig): void {
  ensureDocsStructure();
  fs.writeFileSync(
    getSyncConfigPath(),
    JSON.stringify(config, null, 2),
    'utf-8'
  );
}

// 更新文档的同步状态
export function updateDocSyncStatus(
  docId: string,
  githubPath: string
): Document | null {
  const existing = getDoc(docId);
  if (!existing) {
    return null;
  }

  const updatedMeta: DocMeta = {
    ...existing.meta,
    syncedAt: Date.now(),
    githubPath
  };

  fs.writeFileSync(
    getDocMetaPath(docId),
    JSON.stringify(updatedMeta, null, 2),
    'utf-8'
  );

  updateDocInIndex(updatedMeta);

  return { meta: updatedMeta, content: existing.content };
}

// ============ 搜索功能 ============

// 简单的全文搜索
export function searchDocs(query: string, limit = 10): DocListItem[] {
  const docs = listDocs();
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
    const doc = getDoc(docMeta.id);
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

// 获取文档内容片段（用于搜索结果展示）
export function getDocSnippet(
  docId: string,
  query: string,
  length = 150
): string {
  const doc = getDoc(docId);
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
