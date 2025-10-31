import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '../types';
import { LLM_PROVIDERS, VISION_PROVIDERS } from './providers';
import { getConfig } from '../lib/config';
import { LLMProviderSchema } from '../../types/llm';
import { checkModelAvailability } from './lib';
import z from 'zod';

const t = initTRPC.context<TRPCContext>().create();

export const llmRouter = t.router({
  getProviders: t.procedure.query(async () => {
    const config = await getConfig();
    const providersWithStatus = LLM_PROVIDERS.map((provider) => ({
      ...provider,
      isConfigured: !!config[provider.apiKeyField]
    }));
    return providersWithStatus;
  }),

  getVisionProviders: t.procedure.query(async () => {
    return VISION_PROVIDERS.map((provider) => ({
      id: provider,
      name: LLM_PROVIDERS.find((p) => p.id === provider)?.name || '',
      description:
        LLM_PROVIDERS.find((p) => p.id === provider)?.description || ''
    }));
  }),

  checkModelAvailability: t.procedure
    .input(z.object({ provider: LLMProviderSchema }))
    .mutation(async ({ input }) => {
      const { provider } = input;
      const isAvailable = await checkModelAvailability(provider);
      return { isAvailable };
    }),

  getModelSuggestions: t.procedure
    .input(z.object({ provider: LLMProviderSchema }))
    .query(async ({ input }) => {
      const { provider } = input;
      switch (provider) {
        case 'gemini':
          return ['gemini-2.5-pro', 'gemini-2.5-flash'];
        case 'doubao':
          return [
            'doubao-seed-1-6-lite-251015',
            'doubao-seed-1-6-251015',
            'doubao-seed-1-6-flash-250828',
            'doubao-seed-1-6-vision-250815',
            'doubao-seed-1-6-thinking-250715'
          ];
        default:
          return [];
      }
    })
});
