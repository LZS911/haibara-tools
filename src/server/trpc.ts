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

export const appRouter = t.router({
  convert: convertRouter
});

export const trpcMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPContext
});
