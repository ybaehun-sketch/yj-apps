import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

const search = z.object({ redirect: z.string().optional() });

function safePath(p?: string) {
  if (!p) return "/admin";
  try {
    const u = new URL(p, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : "/admin";
  } catch {
    return "/admin";
  }
}

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "운영자 로그인 — 대나무숲 속풀이" },
      { name: "description", content: "대나무숲 속풀이 운영자 전용 로그인" },
      { property: "og:title", content: "운영자 로그인 — 대나무숲 속풀이" },
      { property: "og:description", content: "대나무숲 속풀이 운영자 전용 로그인" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  const go = () => navigate({ to: safePath(redirect) as "/admin" });

  // 구글 로그인 후 돌아왔을 때 세션이 있으면 바로 운영자 화면으로
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") go(); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (res.error) { toast.error("구글 로그인에 실패했어요."); return; }
    if (res.redirected) return;
    go();
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <div className="rounded-3xl border border-border bg-card p-7">
        <p className="text-center text-4xl">🎋</p>
        <p className="mt-2 text-center text-sm text-muted-foreground">대나무숲 속풀이</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-bold">
          운영자 로그인
        </h1>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>Google로 계속하기</Button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">운영자 전용 페이지예요. 등록된 운영자만 글을 쓸 수 있어요.</p>
      </div>
    </main>
  );
}
