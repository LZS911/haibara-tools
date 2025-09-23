import type { appRouter, createTRPContext } from './trpc';

export type TRPCContext = Awaited<ReturnType<typeof createTRPContext>>;

export type AppRouter = typeof appRouter;
