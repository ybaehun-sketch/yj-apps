import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { adminLogin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const go = () => navigate({ to: safePath(redirect) as "/admin" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await adminLogin({ data: { password } });
      if (!res.ok) throw new Error(res.message);
      go();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <div className="rounded-3xl border border-border bg-card p-7">
        <p className="text-center text-4xl">🎋</p>
        <p className="mt-2 text-center text-sm text-muted-foreground">대나무숲 속풀이</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-bold">
          운영자 로그인
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input
            type="password"
            required
            autoFocus
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            로그인
          </Button>
        </form>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">운영자 전용 페이지예요. 관리자 비밀번호를 아시는 분만 들어올 수 있어요.</p>
      </div>
    </main>
  );
}
