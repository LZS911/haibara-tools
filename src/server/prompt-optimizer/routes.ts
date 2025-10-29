import { initTRPC } from '@trpc/server';
import z from 'zod';
import type { TRPCContext } from '../types';
import {
  OptimizationRequestSchema,
  OptimizationResponseSchema,
  PromptTemplateSchema,
  PromptTypeSchema,
  AllOptimizationOptionsSchema
} from '@/types/prompt-optimizer';
import { listTemplates, optimizePrompt } from './service';
import { getAllOptions } from './options';

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
      return optimizePrompt(input);
    }),

  getTemplates: t.procedure
    .input(z.object({ category: PromptTypeSchema.optional() }))
    .output(z.array(PromptTemplateSchema))
    .query(async ({ input }) => {
      return listTemplates(input.category);
    })
});
