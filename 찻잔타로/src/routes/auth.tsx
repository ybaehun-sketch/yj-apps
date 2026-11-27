import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AD_ONLY_MODE } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_GOOGLE_CLIENT_ID =
  "662893088768-i2v5dh9ll98pvo5netvqtvg7f1batn06.apps.googleusercontent.com";

type GoogleGsiWindow = Window & {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
          nonce?: string;
          ux_mode?: "popup" | "redirect";
          auto_select?: boolean;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: "standard" | "icon";
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            width?: number;
            locale?: string;
          },
        ) => void;
      };
    };
  };
};

async function createNoncePair(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const rawNonce = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const encoded = new TextEncoder().encode(rawNonce);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hashedNonce = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return { rawNonce, hashedNonce };
}

const search = z.object({ redirect: z.string().optional() });

function safePath(p?: string) {
  if (!p) return "/";
  try {
    const u = new URL(p, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "로그인 — 찻잔 타로" },
      { name: "description", content: "로그인하고 나만의 타로 상담 기록을 간직하세요." },
      { property: "og:title", content: "로그인 — 찻잔 타로" },
      { property: "og:description", content: "로그인하고 나만의 타로 상담 기록을 간직하세요." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [age, setAge] = useState(false);
  const [agree, setAgree] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const consented = age && agree;

  const go = () => {
    const p = safePath(redirect);
    navigate({ to: p as "/" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clientId =
      (import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined)?.trim() ||
      DEFAULT_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    const initGsi = async () => {
      const win = window as GoogleGsiWindow;
      const gsi = win.google?.accounts?.id;
      if (!gsi || !googleBtnRef.current || cancelled) return;

      try {
        const { rawNonce, hashedNonce } = await createNoncePair();
        if (cancelled || !googleBtnRef.current) return;

        gsi.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          ux_mode: "popup",
          callback: async (response) => {
            if (!response.credential) {
              toast.error("구글 로그인 정보를 받지 못했어요.");
              return;
            }
            setBusy(true);
            try {
              if (redirect) sessionStorage.setItem("after-login", safePath(redirect));
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce: rawNonce,
              });
              if (error) throw error;
              toast.success("반가워요! 구글 계정으로 로그인되었어요.");
              go();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "구글 로그인에 실패했어요.");
            } finally {
              setBusy(false);
            }
          },
        });

        googleBtnRef.current.innerHTML = "";
        gsi.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 340,
          locale: "ko",
        });
        setGsiReady(true);
      } catch {
        setGsiReady(false);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      if ((window as GoogleGsiWindow).google?.accounts?.id) {
        void initGsi();
      } else {
        existing.addEventListener("load", () => void initGsi(), { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => void initGsi();
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("확인 메일을 보냈어요. 메일의 링크를 눌러 가입을 완료해 주세요.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      go();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (redirect) sessionStorage.setItem("after-login", safePath(redirect));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error("구글 로그인에 실패했어요.");
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-10">
      <div className="rounded-3xl border bg-card p-7 shadow-warm">
        <p className="text-center text-4xl">🍵</p>
        <p className="mt-2 text-center font-serif text-sm text-muted-foreground">찻잔 타로</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-bold">
          {mode === "in" ? "로그인" : "회원가입"}
        </h1>
        {mode === "up" && (
          <div className="mt-6 space-y-2 rounded-xl border bg-background/60 p-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-primary" checked={age} onChange={(e) => setAge(e.target.checked)} />
              <span><b className="text-primary">[필수]</b> 만 14세 이상이에요</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-primary" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                <b className="text-primary">[필수]</b>{" "}
                <Link to="/terms" className="underline">이용약관</Link>과{" "}
                <Link to="/privacy" className="underline">개인정보처리방침</Link>에 동의해요
              </span>
            </label>
          </div>
        )}
        <div
          className={`relative mt-6 w-full ${
            mode === "up" && !consented ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={google}
            disabled={busy || (mode === "up" && !consented)}
          >
            Google로 계속하기
          </Button>
          <div
            ref={googleBtnRef}
            className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.01] ${
              gsiReady && !busy ? "" : "pointer-events-none"
            }`}
          />
        </div>
        {!AD_ONLY_MODE && (
          <>
            <div className="my-4 text-center text-xs text-muted-foreground">또는 이메일로</div>
            <form onSubmit={submit} className="space-y-3">
              <Input type="email" required placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                type="password"
                required
                minLength={6}
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={busy || (mode === "up" && !consented)}>
                {mode === "in" ? "로그인" : "회원가입"}
              </Button>
            </form>
            {mode === "in" && (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                만 14세 이상만 이용할 수 있어요. 계속하면 찻잔 타로의{" "}
                <Link to="/terms" className="underline">이용약관</Link>과{" "}
                <Link to="/privacy" className="underline">개인정보처리방침</Link>에 동의하는 것으로 봐요.
              </p>
            )}
            <button
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
