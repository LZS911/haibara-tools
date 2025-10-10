import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { TRPCContext } from './types';
import { convertRouter } from './convert';

export const createTRPContext = ({
  req: _req,
  res: _res
}: CreateExpressContextOptions) => ({});

const t = initTRPC.context<TRPCContext>().create();

import { mediaToDocsRouter } from './media-to-docs';

export const appRouter = t.router({
  convert: convertRouter,
  mediaToDoc: mediaToDocsRouter
});

export const trpcMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPContext
});
