import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { t as tr, useLang } from "@/lib/i18n";
import jungbiAvatar from "@/assets/jungbi-avatar.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "로그인 — 톡비서" },
      { name: "description", content: "톡비서에 로그인하고 스샷·메모·링크를 던져 두세요." },
      { property: "og:title", content: "톡비서 로그인" },
      { property: "og:description", content: "던지기만 하면 AI 비서가 정리해 드려요." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  useLang();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) nav({ to: "/inbox" }); });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) nav({ to: "/inbox" }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/inbox` } });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    if (mode === "up" && !res.data.session) setMsg(tr("확인 메일을 보냈어요. 메일의 링크를 눌러 주세요 ✉️"));
  }

  async function google() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      setBusy(false);
      setMsg(tr("구글 로그인에 실패했어요"));
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-chat px-6">
      <div className="text-center">
        <img src={jungbiAvatar} alt={tr("톡비서")} width={64} height={64} className="mx-auto mb-3 size-16 rounded-3xl bg-primary object-cover" />
        <h1 className="text-2xl font-bold text-foreground">{tr("톡비서")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("던지기만 하세요. 정리는 제가 할게요.")}</p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-5 shadow-sm">
        <input type="email" required placeholder={tr("이메일")} value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input type="password" required minLength={6} placeholder={tr("비밀번호")} value={pw} onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {mode === "in" ? tr("로그인") : tr("회원가입")}
        </button>
        <button type="button" disabled={busy} onClick={google} className="w-full rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground disabled:opacity-60">
          {tr("Google로 계속하기")}
        </button>
        {msg && <p className="text-center text-xs text-muted-foreground">{msg}</p>}
        <p className="text-center text-xs text-muted-foreground">
          {mode === "in" ? tr("처음이신가요? ") : tr("이미 계정이 있나요? ")}
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-semibold text-foreground underline">
            {mode === "in" ? tr("회원가입") : tr("로그인")}
          </button>
        </p>
      </form>
    </div>
  );
}
