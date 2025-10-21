import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { TRPCContext } from './types';

export const createTRPContext = ({
  req: _req,
  res: _res
}: CreateExpressContextOptions) => ({});

const t = initTRPC.context<TRPCContext>().create();

import { mediaToDocsRouter } from './media-to-docs';
import { bilibiliRouter } from './bilibili';
import { llmRouter } from './llm';
import { voiceCloningRouter } from './voice-cloning';

export const appRouter = t.router({
  mediaToDoc: mediaToDocsRouter,
  bilibili: bilibiliRouter,
  llm: llmRouter,
  voiceCloning: voiceCloningRouter
});

export const trpcMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPContext
});
