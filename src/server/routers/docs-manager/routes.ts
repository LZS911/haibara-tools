import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import type { TRPCContext } from '../../types';
import {
  DocumentSchema,
  DocListItemSchema,
  DocTemplateSchema,
  GitHubSyncConfigSchema,
  CreateDocInputSchema,
  UpdateDocInputSchema,
  CreateTemplateInputSchema,
  TemplateCategorySchema,
  AIOperationSchema,
  AIDocResponseSchema,
  KnowledgeSearchResultSchema
} from '@/types/docs';
import { LLMProviderSchema } from '@/types/llm';
import * as storage from './storage';
import * as templates from './templates';
import { createGitHubDocsSyncService } from './github-sync';
import {
  createAIDocService,
  searchKnowledgeBase,
  aiEnhancedSearch
} from './ai-service';

const t = initTRPC.context<TRPCContext>().create();

export const docsRouter = t.router({
  // ============ 文档 CRUD ============

  // 获取文档列表
  list: t.procedure.output(z.array(DocListItemSchema)).query(() => {
    return storage.listDocs();
  }),

  // 获取单个文档
  get: t.procedure
    .input(z.object({ id: z.string() }))
    .output(DocumentSchema.nullable())
    .query(({ input }) => {
      return storage.getDoc(input.id);
    }),

  // 创建文档
  create: t.procedure
    .input(CreateDocInputSchema)
    .output(DocumentSchema)
    .mutation(({ input }) => {
      // 如果指定了模板，获取模板内容
      let content = input.content || '';
      if (input.templateId) {
        const template = templates.getTemplate(input.templateId);
        if (template) {
          content = templates.processTemplateContent(template.content);
        }
      }

      return storage.createDoc({
        ...input,
        content
      });
    }),

  // 更新文档
  update: t.procedure
    .input(UpdateDocInputSchema)
    .output(DocumentSchema.nullable())
    .mutation(({ input }) => {
      return storage.updateDoc(input);
    }),

  // 删除文档
  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => {
      const success = storage.deleteDoc(input.id);
      return { success };
    }),

  // ============ 模板管理 ============

  // 获取所有模板
  listTemplates: t.procedure
    .input(z.object({ category: TemplateCategorySchema.optional() }).optional())
    .output(z.array(DocTemplateSchema))
    .query(({ input }) => {
      return templates.listTemplates(input?.category);
    }),

  // 获取单个模板
  getTemplate: t.procedure
    .input(z.object({ id: z.string() }))
    .output(DocTemplateSchema.nullable())
    .query(({ input }) => {
      return templates.getTemplate(input.id);
    }),

  // 创建模板
  createTemplate: t.procedure
    .input(CreateTemplateInputSchema)
    .output(DocTemplateSchema)
    .mutation(({ input }) => {
      return templates.createTemplate(input);
    }),

  // 更新模板
  updateTemplate: t.procedure
    .input(
      z.object({
        id: z.string(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          content: z.string().optional(),
          category: TemplateCategorySchema.optional()
        })
      })
    )
    .output(DocTemplateSchema.nullable())
    .mutation(({ input }) => {
      return templates.updateTemplate(input.id, input.updates);
    }),

  // 删除模板
  deleteTemplate: t.procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => {
      const success = templates.deleteTemplate(input.id);
      return { success };
    }),

  // 从文档创建模板
  createTemplateFromDoc: t.procedure
    .input(
      z.object({
        docId: z.string(),
        name: z.string(),
        description: z.string(),
        category: TemplateCategorySchema.optional()
      })
    )
    .output(DocTemplateSchema.nullable())
    .mutation(({ input }) => {
      const doc = storage.getDoc(input.docId);
      if (!doc) {
        return null;
      }

      return templates.createTemplateFromDoc(
        input.name,
        input.description,
        doc.content,
        input.category
      );
    }),

  // ============ GitHub 同步 ============

  // 获取同步配置
  getSyncConfig: t.procedure.output(GitHubSyncConfigSchema).query(() => {
    return storage.getSyncConfig();
  }),

  // 更新同步配置
  updateSyncConfig: t.procedure
    .input(GitHubSyncConfigSchema.partial())
    .output(GitHubSyncConfigSchema)
    .mutation(({ input }) => {
      const current = storage.getSyncConfig();
      const updated = { ...current, ...input };
      storage.saveSyncConfig(updated);
      return updated;
    }),

  // 获取 GitHub 仓库列表
  listGitHubRepos: t.procedure
    .output(
      z.array(
        z.object({
          name: z.string(),
          fullName: z.string(),
          private: z.boolean(),
          defaultBranch: z.string()
        })
      )
    )
    .query(async () => {
      const config = storage.getSyncConfig();
      const service = await createGitHubDocsSyncService(config);
      if (!service) {
        return [];
      }
      return service.listRepos();
    }),

  // 创建 GitHub 仓库
  createGitHubRepo: t.procedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        private: z.boolean().optional()
      })
    )
    .output(
      z.object({
        name: z.string(),
        fullName: z.string(),
        defaultBranch: z.string(),
        htmlUrl: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const config = storage.getSyncConfig();
      const service = await createGitHubDocsSyncService(config);
      if (!service) {
        throw new Error('GitHub token not configured');
      }
      return service.createRepo(
        input.name,
        input.description || '',
        input.private ?? true
      );
    }),

  // 获取仓库内容
  getRepoContents: t.procedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().optional()
      })
    )
    .output(
      z.array(
        z.object({
          name: z.string(),
          path: z.string(),
          sha: z.string(),
          size: z.number(),
          type: z.enum(['file', 'dir']),
          downloadUrl: z.string().optional()
        })
      )
    )
    .query(async ({ input }) => {
      const config = storage.getSyncConfig();
      const service = await createGitHubDocsSyncService(config);
      if (!service) {
        return [];
      }
      return service.getRepoContents(input.owner, input.repo, input.path);
    }),

  // 同步文档到 GitHub
  syncToGitHub: t.procedure
    .input(z.object({ docId: z.string() }))
    .output(
      z.object({
        success: z.boolean(),
        path: z.string().optional(),
        error: z.string().optional()
      })
    )
    .mutation(async ({ input }) => {
      const config = storage.getSyncConfig();
      if (!config.enabled || !config.owner || !config.repo) {
        return { success: false, error: 'GitHub sync not configured' };
      }

      const service = await createGitHubDocsSyncService(config);
      if (!service) {
        return { success: false, error: 'GitHub token not configured' };
      }

      const doc = storage.getDoc(input.docId);
      if (!doc) {
        return { success: false, error: 'Document not found' };
      }

      try {
        const result = await service.syncDocToGitHub(
          config.owner,
          config.repo,
          doc
        );
        // 更新文档的同步状态
        storage.updateDocSyncStatus(input.docId, result.path);
        return { success: true, path: result.path };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Sync failed'
        };
      }
    }),

  // 从 GitHub 拉取文档
  pullFromGitHub: t.procedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string()
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        doc: DocumentSchema.optional(),
        error: z.string().optional()
      })
    )
    .mutation(async ({ input }) => {
      const config = storage.getSyncConfig();
      const service = await createGitHubDocsSyncService(config);
      if (!service) {
        return { success: false, error: 'GitHub token not configured' };
      }

      try {
        const pulled = await service.pullDocFromGitHub(
          input.owner,
          input.repo,
          input.path
        );
        if (!pulled) {
          return { success: false, error: 'File not found' };
        }

        // 创建本地文档
        const doc = storage.createDoc({
          title: pulled.title,
          content: pulled.content,
          description: pulled.description,
          tags: pulled.tags || []
        });

        // 更新同步状态
        storage.updateDocSyncStatus(doc.meta.id, input.path);

        return { success: true, doc };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Pull failed'
        };
      }
    }),

  // ============ AI 功能 ============

  // AI 处理内容
  aiProcess: t.procedure
    .input(
      z.object({
        content: z.string(),
        operation: AIOperationSchema,
        provider: LLMProviderSchema,
        context: z.string().optional(),
        language: z.string().optional()
      })
    )
    .output(AIDocResponseSchema)
    .mutation(async ({ input }) => {
      const service = createAIDocService(input.provider);
      return service.processContent(
        input.content,
        input.operation,
        input.context,
        input.language
      );
    }),

  // AI 流式处理
  aiProcessStream: t.procedure
    .input(
      z.object({
        content: z.string(),
        operation: AIOperationSchema,
        provider: LLMProviderSchema,
        context: z.string().optional(),
        language: z.string().optional()
      })
    )
    .subscription(({ input }) => {
      return observable<{ type: 'chunk' | 'complete'; content: string }>(
        (emit) => {
          (async () => {
            const service = createAIDocService(input.provider);
            const stream = service.processContentStream(
              input.content,
              input.operation,
              input.context,
              input.language
            );

            try {
              for await (const chunk of stream) {
                emit.next(chunk);
                if (chunk.type === 'complete') {
                  emit.complete();
                  break;
                }
              }
            } catch (error) {
              emit.error(error as Error);
            }
          })();

          return () => {
            // 清理逻辑
          };
        }
      );
    }),

  // 生成标签
  aiGenerateTags: t.procedure
    .input(
      z.object({
        content: z.string(),
        provider: LLMProviderSchema
      })
    )
    .output(z.array(z.string()))
    .mutation(async ({ input }) => {
      const service = createAIDocService(input.provider);
      return service.generateTags(input.content);
    }),

  // 生成标题建议
  aiSuggestTitle: t.procedure
    .input(
      z.object({
        content: z.string(),
        provider: LLMProviderSchema
      })
    )
    .output(z.string())
    .mutation(async ({ input }) => {
      const service = createAIDocService(input.provider);
      return service.suggestTitle(input.content);
    }),

  // ============ 搜索功能 ============

  // 搜索文档
  search: t.procedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .output(z.array(DocListItemSchema))
    .query(({ input }) => {
      return storage.searchDocs(input.query, input.limit);
    }),

  // 知识库搜索
  searchKnowledge: t.procedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .output(z.array(KnowledgeSearchResultSchema))
    .query(async ({ input }) => {
      return searchKnowledgeBase(input.query, input.limit);
    }),

  // AI 增强搜索
  aiSearch: t.procedure
    .input(
      z.object({
        query: z.string(),
        provider: LLMProviderSchema,
        limit: z.number().optional()
      })
    )
    .output(z.array(KnowledgeSearchResultSchema))
    .mutation(async ({ input }) => {
      return aiEnhancedSearch(input.query, input.provider, input.limit);
    }),

  // ============ 资源管理 ============

  // 上传图片
  uploadAsset: t.procedure
    .input(
      z.object({
        docId: z.string(),
        fileName: z.string(),
        data: z.string() // base64 编码的数据
      })
    )
    .output(z.object({ path: z.string() }))
    .mutation(({ input }) => {
      const buffer = Buffer.from(input.data, 'base64');
      const relativePath = storage.saveDocAsset(
        input.docId,
        input.fileName,
        buffer
      );
      return { path: relativePath };
    }),

  // 列出资源
  listAssets: t.procedure
    .input(z.object({ docId: z.string() }))
    .output(z.array(z.string()))
    .query(({ input }) => {
      return storage.listDocAssets(input.docId);
    }),

  // 删除资源
  deleteAsset: t.procedure
    .input(z.object({ docId: z.string(), fileName: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => {
      const success = storage.deleteDocAsset(input.docId, input.fileName);
      return { success };
    })
});
