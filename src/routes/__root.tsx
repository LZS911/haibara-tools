import { createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Layout } from './-components/layout';
import { KeepAliveOutlet, KeepAliveProvider } from 'tanstack-router-keepalive';
import { UpdateNotification } from './-components/update-notification';
import { Toaster } from './-components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <KeepAliveProvider>
      <Layout>
        <KeepAliveOutlet />
        <UpdateNotification />
        <TanStackRouterDevtools />
        <Toaster />
      </Layout>
    </KeepAliveProvider>
  )
});
