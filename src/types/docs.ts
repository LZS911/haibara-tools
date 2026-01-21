import { z } from 'zod';
import { LLMProviderSchema } from './llm';

// ============ 文档相关类型 ============

// 文档元数据 Schema
export const DocMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
  syncedAt: z.number().optional(), // 最后同步到 GitHub 的时间
  githubPath: z.string().optional(), // GitHub 上的路径
  templateId: z.string().optional() // 基于的模板 ID
});

export type DocMeta = z.infer<typeof DocMetaSchema>;

// 完整文档 Schema
export const DocumentSchema = z.object({
  meta: DocMetaSchema,
  content: z.string() // Markdown 内容
});

export type Document = z.infer<typeof DocumentSchema>;

// 文档列表项 Schema (不包含内容，用于列表展示)
export const DocListItemSchema = DocMetaSchema;

export type DocListItem = z.infer<typeof DocListItemSchema>;

// ============ 模板相关类型 ============

// 模板分类
export const TemplateCategorySchema = z.enum([
  'general',
  'work',
  'study',
  'personal'
]);

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

// 模板 Schema
export const DocTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  content: z.string(), // Markdown 内容
  category: TemplateCategorySchema,
  isBuiltIn: z.boolean(),
  createdAt: z.number()
});

export type DocTemplate = z.infer<typeof DocTemplateSchema>;

// ============ GitHub 同步相关类型 ============

// GitHub 同步配置 Schema
export const GitHubSyncConfigSchema = z.object({
  enabled: z.boolean().default(false),
  owner: z.string().optional(), // GitHub 用户名
  repo: z.string().optional(), // 仓库名
  branch: z.string().default('main'),
  directory: z.string().default('docs'), // 文档存储目录
  imageDirectory: z.string().default('docs/assets'), // 图片存储目录
  autoSync: z.boolean().default(false) // 是否自动同步
});

export type GitHubSyncConfig = z.infer<typeof GitHubSyncConfigSchema>;

// GitHub 文件信息
export const GitHubFileInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  size: z.number(),
  type: z.enum(['file', 'dir']),
  downloadUrl: z.string().optional()
});

export type GitHubFileInfo = z.infer<typeof GitHubFileInfoSchema>;

// ============ AI 功能相关类型 ============

// AI 操作类型
export const AIOperationSchema = z.enum([
  'polish', // 润色
  'continue', // 续写
  'summarize', // 摘要
  'rewrite', // 改写
  'translate', // 翻译
  'expand', // 扩展
  'simplify' // 简化
]);

export type AIOperation = z.infer<typeof AIOperationSchema>;

// AI 请求 Schema
export const AIDocRequestSchema = z.object({
  content: z.string(),
  operation: AIOperationSchema,
  provider: LLMProviderSchema,
  context: z.string().optional(), // 额外上下文
  language: z.string().optional() // 目标语言（用于翻译）
});

export type AIDocRequest = z.infer<typeof AIDocRequestSchema>;

// AI 响应 Schema
export const AIDocResponseSchema = z.object({
  result: z.string(),
  operation: AIOperationSchema,
  tokensUsed: z.number().optional()
});

export type AIDocResponse = z.infer<typeof AIDocResponseSchema>;

// 知识库搜索请求
export const KnowledgeSearchRequestSchema = z.object({
  query: z.string(),
  limit: z.number().default(5)
});

export type KnowledgeSearchRequest = z.infer<
  typeof KnowledgeSearchRequestSchema
>;

// 知识库搜索结果
export const KnowledgeSearchResultSchema = z.object({
  docId: z.string(),
  title: z.string(),
  snippet: z.string(), // 匹配的内容片段
  score: z.number() // 相关度分数
});

export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;

// ============ 创建/更新文档的输入类型 ============

export const CreateDocInputSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().default(''),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  templateId: z.string().optional()
});

export type CreateDocInput = z.infer<typeof CreateDocInputSchema>;

export const UpdateDocInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateDocInput = z.infer<typeof UpdateDocInputSchema>;

// ============ 创建模板的输入类型 ============

export const CreateTemplateInputSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string().default(''),
  content: z.string().default(''),
  category: TemplateCategorySchema.default('general')
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;
