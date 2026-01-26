import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Layout } from './-components/layout';
import { UpdateNotification } from './-components/update-notification';
import { Toaster } from './-components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <UpdateNotification />
      <TanStackRouterDevtools />
      <Toaster />
    </Layout>
  )
});
