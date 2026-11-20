import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { admin } = await checkAdmin();
    if (!admin) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});