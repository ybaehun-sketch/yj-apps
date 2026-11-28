import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AD_ONLY_MODE } from "@/lib/access";
import { useI18n } from "@/lib/i18n";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

/** 스마트폰 앱(웹뷰 래퍼) 환경인지 구분 — 앱에서는 웹 애드센스를 숨기고 애드몹을 사용 */
export function isAppWrapper(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.ReactNativeWebView) || new URLSearchParams(window.location.search).get("app") === "1";
}

/** 웹 배너 광고 자리 (애드센스 심사를 위해 가짜 광고 목업은 노출하지 않음) */
export function AdBanner() {
  return null;
}

/** 화면 하단 고정 배너 자리 (애드센스 심사를 위해 가짜 광고 목업은 노출하지 않음) */
export function FixedAdBanner() {
  return null;
}

/** 보상형 대기/광고 연결 창: 앱(애드몹 브릿지)이면 네이티브 보상 광고 호출, 웹이면 차 우리기 대기 후 보상 제공 */
export function RewardedAdDialog({
  open,
  onOpenChange,
  onReward,
  seconds = 5,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReward: () => void;
  seconds?: number;
}) {
  const { t } = useI18n();
  const [left, setLeft] = useState(seconds);
  const [nativeAdActive, setNativeAdActive] = useState(false);

  useEffect(() => {
    if (!open) {
      setNativeAdActive(false);
      return;
    }

    setLeft(seconds);
    let timer: ReturnType<typeof setInterval> | null = null;
    const startWebTimer = () => {
      if (timer) return;
      timer = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    };

    // 앱 래퍼가 연결되어 있으면 애드몹 보상형 광고 실행 요청 (1차 무광고 앱은 1.2초 내 응답이 없으면 웹 대기 모드로 폴백)
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      let acked = false;
      const handleMsg = (e: MessageEvent) => {
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data?.type === "REWARDED_AD_ACK") {
            acked = true;
            setNativeAdActive(true);
          } else if (data?.type === "REWARDED_AD_DONE") {
            acked = true;
            onReward();
            onOpenChange(false);
          } else if (data?.type === "REWARDED_AD_CLOSED") {
            acked = true;
            onOpenChange(false);
          }
        } catch { /* ignore non-JSON messages */ }
      };
      window.addEventListener("message", handleMsg);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SHOW_REWARDED_AD" }));
      const fallback = setTimeout(() => {
        if (!acked) startWebTimer();
      }, 1200);
      return () => {
        clearTimeout(fallback);
        if (timer) clearInterval(timer);
        window.removeEventListener("message", handleMsg);
      };
    }

    startWebTimer();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [open, seconds, onReward, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-none bg-cocoa p-6 text-cocoa-foreground">
        <DialogTitle className="sr-only">{t("adSr")}</DialogTitle>
        <div className="my-4 flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-card text-card-foreground">
          <span className="animate-steam text-6xl">🍵</span>
          <p className="mt-4 font-serif text-xl font-bold">{t("adBrewTitle")}</p>
          <p className="mt-1 px-6 text-center text-sm text-muted-foreground">
            {nativeAdActive ? t("adWaitNative") : t("adWaitWeb")}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background/20">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${nativeAdActive ? 50 : ((seconds - left) / seconds) * 100}%` }} />
        </div>
        <Button
          className="mt-4 w-full"
          disabled={nativeAdActive || left > 0}
          onClick={() => {
            onReward();
            onOpenChange(false);
          }}
        >
          {nativeAdActive ? t("adChecking") : left > 0 ? t("adBrewing", { n: left }) : t("adContinue")}
        </Button>
        {!AD_ONLY_MODE && (
          <Link to="/membership" className="mt-2 block text-center text-xs underline opacity-70">
            {t("adLeafLink")}
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}
