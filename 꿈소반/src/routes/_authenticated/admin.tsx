import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { GuideEditor } from "@/components/GuideEditor";
import { checkAdmin, adminLogout } from "@/lib/admin-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "꿈소반 · 운영자 화면" },
      { name: "description", content: "꿈소반 운영자 전용 글 관리 화면" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const check = useServerFn(checkAdmin);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await adminLogout();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">확인하는 중…</p>;
  if (!me?.admin)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="mb-4">운영자만 들어올 수 있는 곳이에요.</p>
        <div className="flex justify-center gap-3">
          <Link to="/" className="underline">홈으로</Link>
          <button className="underline" onClick={signOut}>로그아웃</button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5">
      <Toaster position="top-center" />
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">🌙 운영자 화면 · 글 관리</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/guide" className="text-muted-foreground underline">글 목록</Link>
          <Link to="/" className="text-muted-foreground underline">홈</Link>
          <Button size="sm" variant="outline" onClick={signOut}>로그아웃</Button>
        </div>
      </header>
      <GuideEditor />
    </div>
  );
}
