import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { isSoundOn, setSoundOn, sfx } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { AccountMenu } from "@/components/AccountMenu";
import { LegalLinks } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";
import { AD_ONLY_MODE } from "@/lib/access";
import { I18nProvider, LANG_BOOT_SCRIPT, LANG_BOOT_STYLE, useI18n, LanguageSelector, type TranslationKey } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">페이지를 찾을 수 없어요</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">페이지를 불러오지 못했어요</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, interactive-widget=resizes-content" },
      { name: "google-site-verification", content: "oVpJuR6PduzElCugJLL2Z8hmIXk44B5dro18v69RniE" },
      { name: "naver-site-verification", content: "77feab6f3e3ff6789c38aee16e63f378005a3fd4" },
      { title: "찻잔 타로 — 따뜻한 대화형 타로 상담" },
      { name: "description", content: "고민을 들려주면 3장의 카드와 함께 다정하게 이야기 나눠주는 AI 타로 상담" },
      { property: "og:title", content: "찻잔 타로 — 따뜻한 대화형 타로 상담" },
      { property: "og:description", content: "고민을 들려주면 3장의 카드와 함께 다정하게 이야기 나눠주는 AI 타로 상담" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const ADSENSE_BOOT_SCRIPT = `if(!/[?&]app=1/.test(location.search)&&!window.ReactNativeWebView&&!/^\\/(auth|admin|terms|privacy|about|contact|membership|new|readings|reading)(\\/|$)/.test(location.pathname)){var s=document.createElement("script");s.async=true;s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1356528417680958";s.crossOrigin="anonymous";document.head.appendChild(s);}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: LANG_BOOT_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ADSENSE_BOOT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SoundToggle() {
  const { t } = useI18n();
  const [on, setOn] = useState(true);
  useEffect(() => setOn(isSoundOn()), []);
  return (
    <button
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
        if (!on) sfx.clink();
      }}
      aria-label={on ? t("soundOff") : t("soundOn")}
      title={on ? t("soundOff") : t("soundOn")}
      className="flex items-center hover:text-foreground"
    >
      {on ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
    </button>
  );
}

function Header() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const backLabel = pathname.startsWith("/reading/")
    ? t("backExit")
    : pathname === "/new"
      ? t("backConcern")
      : t("backPrev");
  const goBack = () => {
    if (pathname.startsWith("/reading/")) {
      window.location.assign(AD_ONLY_MODE ? "/" : "/readings");
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/");
    }
  };
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-4 sm:gap-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {!isHome && (
          <button
            onClick={goBack}
            aria-label={backLabel}
            className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}
        <Link to="/" className="flex min-w-0 items-center gap-1 whitespace-nowrap font-serif text-[15px] font-bold text-foreground sm:gap-1.5 sm:text-lg">
          <span className="shrink-0 text-lg sm:text-2xl">🍵</span> <span className="truncate">{t("brandTitle")}</span>
        </Link>
      </div>
      <nav className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[14px] font-medium text-foreground/80 sm:gap-4 sm:text-[15px]">
        <LanguageSelector />
        <SoundToggle />
        <Link to="/about" className="hover:text-foreground">
          {t("navAbout")}
        </Link>
        <Link to="/guide" className="hover:text-foreground">
          {t("navGuide")}
        </Link>
        {!AD_ONLY_MODE && (
          <Link to="/membership" className="hover:text-foreground">
            {t("navMembership")}
          </Link>
        )}
        {!AD_ONLY_MODE && (
          user ? (
            <AccountMenu user={user} />
          ) : (
            <Link to="/auth" className="hover:text-foreground">
              {t("navLogin")}
            </Link>
          )
        )}
      </nav>
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/reading/") || pathname.startsWith("/admin") || pathname === "/auth") return null;
  return (
    <footer className="mx-auto mt-6 max-w-3xl border-t border-border/60 px-5 pb-12 pt-5 text-[11px] leading-relaxed text-muted-foreground">
      <LegalLinks />
      <div className="mt-3 space-y-0.5">
        <p>
          {t("footerStudioName")} · {t("footerInquiry")}{" "}
          <a href={`mailto:${BUSINESS.email}`} className="underline-offset-2 hover:underline">
            {BUSINESS.email}
          </a>
        </p>
        <p>{t("footerDisclaimer")}</p>
        <p className="pt-1">© 2026 {t("footerStudioName")}. All rights reserved.</p>
      </div>
    </footer>
  );
}

const ROUTE_TITLES: Record<string, TranslationKey> = {
  "/": "titleHome",
  "/guide": "titleGuide",
  "/about": "titleAbout",
  "/contact": "titleContact",
  "/terms": "titleTerms",
  "/privacy": "titlePrivacy",
  "/new": "titleNew",
};

function TitleSync() {
  const { t, lang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const key = ROUTE_TITLES[pathname] ?? (pathname.startsWith("/reading/") ? "titleReading" : undefined);
    if (key) document.title = t(key);
  }, [pathname, lang, t]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      else queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <I18nProvider>
      <TitleSync />
      <QueryClientProvider client={queryClient}>
        <Header />
        <Outlet />
        <Footer />
        <Toaster />
      </QueryClientProvider>
    </I18nProvider>
  );
}
