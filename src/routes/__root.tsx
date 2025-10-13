import { createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Layout } from './-components/layout';
import { KeepAliveOutlet, KeepAliveProvider } from 'tanstack-router-keepalive';

export const Route = createRootRoute({
  component: () => (
    <KeepAliveProvider>
      <Layout>
        <KeepAliveOutlet />
        <TanStackRouterDevtools />
      </Layout>
    </KeepAliveProvider>
  )
});
