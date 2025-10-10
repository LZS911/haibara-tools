import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink
} from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

// Import the generated route tree
import { routeTree } from '@/routeTree.gen';

import { Spinner } from '@/routes/-components/spinner';
import type { AppRouter } from '@/server/types';

export const queryClient = new QueryClient();

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      splitLink({
        // 根据操作类型选择不同的 link
        condition: (op) => op.type === 'subscription',
        // subscription 使用 SSE
        true: httpSubscriptionLink({
          url: '/trpc'
        }),
        // query 和 mutation 使用 HTTP batch
        false: httpBatchLink({
          url: '/trpc'
        })
      })
    ]
  }),
  queryClient
});

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    context: {
      trpc,
      queryClient
    },
    defaultPendingComponent: () => (
      <div className={`p-2 text-2xl`}>
        <Spinner />
      </div>
    ),
    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
  });

  return router;
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
