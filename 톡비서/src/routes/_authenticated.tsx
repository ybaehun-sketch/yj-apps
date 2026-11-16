import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    return {
      user: data.session?.user ?? {
        id: LOCAL_USER_ID,
        email: "local@talk-secretary",
      },
    };
  },
  component: () => <Outlet />,
});
