import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import z from 'zod';
import type { TRPCContext } from '../types';
import {
  OptimizationRequestSchema,
  OptimizationResponseSchema,
  type OptimizationResponse,
  PromptTemplateSchema,
  PromptTypeSchema,
  AllOptimizationOptionsSchema,
  OptimizationRecordSchema
} from '@/types/prompt-optimizer';
import {
  listTemplates,
  optimizePrompt,
  optimizePromptStream,
  stats,
  resetStats
} from './service';
import { getAllOptions } from './options';
import {
  saveOptimization,
  listHistory,
  getHistoryItem,
  deleteHistoryItem,
  toggleFavorite,
  listFavorites,
  clearHistory
} from './storage';

const t = initTRPC.context<TRPCContext>().create();

export const promptOptimizerRouter = t.router({
  getOptimizationOptions: t.procedure
    .output(AllOptimizationOptionsSchema)
    .query(async () => {
      return getAllOptions();
    }),

  optimize: t.procedure
    .input(OptimizationRequestSchema)
    .output(OptimizationResponseSchema)
    .mutation(async ({ input }) => {
      const result = await optimizePrompt(input);
      // Save to history after successful optimization
      try {
        await saveOptimization(input, result);
      } catch (error) {
        console.error(
          '[Prompt Optimizer] Failed to save optimization to history:',
          error
        );
        // Don't fail the request if history save fails
      }
      return result;
    }),

  optimizeStream: t.procedure
    .input(OptimizationRequestSchema)
    .subscription(async ({ input }) => {
      return observable<{
        type: 'chunk' | 'complete';
        content: string;
        data?: OptimizationResponse;
      }>((emit) => {
        (async () => {
          try {
            for await (const chunk of optimizePromptStream(input)) {
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
          // 清理逻辑（如果需要）
        };
      });
    }),

  getTemplates: t.procedure
    .input(z.object({ category: PromptTypeSchema.optional() }))
    .output(z.array(PromptTemplateSchema))
    .query(async ({ input }) => {
      return listTemplates(input.category);
    }),

  getStats: t.procedure
    .output(
      z.object({
        totalRequests: z.number(),
        cacheHits: z.number(),
        cacheMisses: z.number(),
        streamRequests: z.number(),
        errors: z.number(),
        avgLatency: z.number(),
        lastResetTime: z.string()
      })
    )
    .query(() => {
      return stats;
    }),

  resetStats: t.procedure.mutation(() => {
    resetStats();
    return { success: true };
  }),

  // History and Favorites routes
  getHistory: t.procedure
    .output(z.array(OptimizationRecordSchema))
    .query(async () => {
      return listHistory();
    }),

  getHistoryItem: t.procedure
    .input(z.object({ id: z.string() }))
    .output(OptimizationRecordSchema.nullable())
    .query(async ({ input }) => {
      return getHistoryItem(input.id);
    }),

  deleteHistoryItem: t.procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      const success = await deleteHistoryItem(input.id);
      return { success };
    }),

  toggleFavorite: t.procedure
    .input(z.object({ id: z.string() }))
    .output(OptimizationRecordSchema.nullable())
    .mutation(async ({ input }) => {
      return toggleFavorite(input.id);
    }),

  getFavorites: t.procedure
    .output(z.array(OptimizationRecordSchema))
    .query(async () => {
      return listFavorites();
    }),

  clearHistory: t.procedure
    .output(z.object({ deletedCount: z.number() }))
    .mutation(async () => {
      const deletedCount = await clearHistory();
      return { deletedCount };
    })
});
