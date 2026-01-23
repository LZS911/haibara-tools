import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { TRPCContext } from './types';

export const createTRPContext = ({
  req: _req,
  res: _res
}: CreateExpressContextOptions) => ({});

const t = initTRPC.context<TRPCContext>().create();

import { mediaToDocsRouter } from './routers/media-to-docs';
import { bilibiliRouter } from './routers/bilibili';
import { llmRouter } from './routers/llm';
import { voiceCloningRouter } from './routers/voice-cloning';
import { gitRouter } from './routers/git/routes';
import { promptOptimizerRouter } from './routers/prompt-optimizer';
import { docsRouter } from './routers/docs-manager';

export const appRouter = t.router({
  mediaToDoc: mediaToDocsRouter,
  bilibili: bilibiliRouter,
  llm: llmRouter,
  voiceCloning: voiceCloningRouter,
  git: gitRouter,
  promptOptimizer: promptOptimizerRouter,
  docs: docsRouter
});

export const trpcMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPContext
});
