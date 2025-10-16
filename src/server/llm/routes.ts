import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '../types';
import { LLM_PROVIDERS } from './providers';
import { getConfig } from '../lib/config';

const t = initTRPC.context<TRPCContext>().create();

export const llmRouter = t.router({
  getProviders: t.procedure.query(async () => {
    const config = await getConfig();
    const providersWithStatus = LLM_PROVIDERS.map((provider) => ({
      ...provider,
      isConfigured: !!config[provider.apiKeyField]
    }));
    return providersWithStatus;
  })
});
