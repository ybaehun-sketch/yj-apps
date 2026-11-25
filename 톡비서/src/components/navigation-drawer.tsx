import React, { useState, useEffect, useRef } from "react";
import { MaterialSymbol, IconButton } from "@/components/ui/material-symbol";
import { t as tr, locale, useLang, setLang, LANGS, LANG_LABEL } from "@/lib/i18n";
import { QUOTA_BYTES, fmtBytes, trialDaysLeft, type Usage } from "@/lib/storage-quota";
import { ACCENTS, BILLING_ENABLED, PLAN_LABEL, type Prefs, type Plan } from "@/components/inbox-extras";
import { disablePushNotifications, enablePushNotifications } from "@/lib/push-client";
import jungbiAvatar from "@/assets/jungbi-avatar.png";

const GUIDE_URL = "https://yjstudio.app/tokbiseo#guide";
const PRIVACY_URL = "https://yjstudio.app/tokbiseo#privacy";
const TERMS_URL = "https://yjstudio.app/tokbiseo#terms";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  usage?: Usage;
  email: string;
  joinedAt: string | null;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  onOpenCategories: () => void;
  onOpenBilling: () => void;
  notesCount?: number;
}

export function NavigationDrawer({
  isOpen,
  onClose,
  usage,
  email,
  joinedAt,
  prefs,
  setPrefs,
  onLogout,
  onDeleteAccount,
  onOpenCategories,
  onOpenBilling,
  notesCount = 0,
}: NavigationDrawerProps) {
  const [accountAccordionOpen, setAccountAccordionOpen] = useState(false);
  const [storageDetailsOpen, setStorageDetailsOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [quitText, setQuitText] = useState("");
  const [quitBusy, setQuitBusy] = useState(false);
  const [quitErr, setQuitErr] = useState("");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [alarmNotice, setAlarmNotice] = useState<string | null>(null);

  const lang = useLang();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Drawer swipe left to close
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);

    // If swiping left by more than 50px and horizontal movement exceeds vertical
    if (diffX < -50 && diffY < 80) {
      touchStartX.current = null;
      touchStartY.current = null;
      onClose();
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const u = usage ?? { image: 0, doc: 0, voice: 0, total: 0 };
  const cap = QUOTA_BYTES[prefs.plan];
  const pct = Math.min(100, (u.total / cap) * 100);
  const isPremium = prefs.plan === "premium" || prefs.plan === "lifetime";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Surface */}
      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`absolute top-0 bottom-0 left-0 z-50 flex w-[84%] max-w-[320px] flex-col rounded-r-3xl bg-background border-r border-border/60 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={tr("사이드 메뉴")}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={jungbiAvatar}
              alt={tr("톡비서")}
              width={34}
              height={34}
              className="size-[34px] rounded-xl object-cover shadow-xs"
            />
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                {tr("톡비서")}
              </span>
              <p className="text-[11px] text-muted-foreground">{tr("AI 스마트 비서")}</p>
            </div>
          </div>
          <IconButton ariaLabel={tr("닫기")} onClick={onClose} className="h-9 w-9">
            <MaterialSymbol name="close" size={20} weight={350} />
          </IconButton>
        </div>

        {/* Scrollable Body: Top & Mid */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {/* [상단] 멤버십 상태 배너 카드 */}
          <div
            onClick={BILLING_ENABLED ? onOpenBilling : undefined}
            role={BILLING_ENABLED ? "button" : undefined}
            tabIndex={BILLING_ENABLED ? 0 : undefined}
            className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/10 p-4 shadow-xs transition-all ${
              BILLING_ENABLED ? "cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-[0.99]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-8 items-center justify-center rounded-xl ${
                    BILLING_ENABLED && isPremium ? "bg-amber-500/20 text-amber-500" : "bg-primary/15 text-primary"
                  }`}
                >
                  <MaterialSymbol
                    name={BILLING_ENABLED && isPremium ? "workspace_premium" : "verified"}
                    size={20}
                    weight={400}
                    fill={BILLING_ENABLED && isPremium}
                  />
                </span>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {BILLING_ENABLED ? tr("멤버십 상태") : tr("출시 이벤트")}
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {BILLING_ENABLED
                      ? isPremium
                        ? tr("프리미엄 이용 중")
                        : tr("무료 사용자")
                      : tr("출시 이벤트 무료 사용 기간")}
                  </p>
                </div>
              </div>
              {BILLING_ENABLED && (
                <MaterialSymbol
                  name="chevron_right"
                  size={20}
                  weight={300}
                  className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 whitespace-nowrap rounded-xl bg-muted/60 px-3 py-2 text-[11px]">
              <span className="truncate text-muted-foreground">
                {BILLING_ENABLED
                  ? isPremium
                    ? tr("무제한 스마트 혜택")
                    : tr("톡비서 프리미엄")
                  : tr("정식 결제 도입 전까지 무료로 제공돼요")}
              </span>
              {BILLING_ENABLED && (
                <span className="shrink-0 font-semibold text-primary">
                  {isPremium ? tr("혜택 보기") : tr("업그레이드 안내")}
                </span>
              )}
            </div>
          </div>

          {/* [중단] 편의 메뉴 리스트 */}
          <div className="space-y-1">
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {tr("기능 및 환경 설정")}
            </p>

            {/* 카테고리 만들기 */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCategories();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted active:bg-muted/80"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-foreground/80">
                <MaterialSymbol name="label" size={18} weight={350} />
              </span>
              <span className="flex-1 text-left">{tr("카테고리 만들기 · 관리")}</span>
              <MaterialSymbol name="chevron_right" size={18} weight={300} className="text-muted-foreground" />
            </button>

            {/* 앱 테마 */}
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted active:bg-muted/80"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-foreground/80">
                <MaterialSymbol
                  name={prefs.mode === "dark" ? "dark_mode" : "light_mode"}
                  size={18}
                  weight={350}
                />
              </span>
              <div className="flex-1 text-left">
                <span>{tr("앱 테마")}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({prefs.mode === "dark" ? tr("다크") : tr("라이트")})
                </span>
              </div>
              <MaterialSymbol name="chevron_right" size={18} weight={300} className="text-muted-foreground" />
            </button>

            {/* 언어 선택 */}
            <button
              type="button"
              onClick={() => setLangModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted active:bg-muted/80"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-foreground/80">
                <MaterialSymbol name="language" size={18} weight={350} />
              </span>
              <div className="flex-1 text-left">
                <span>{tr("언어 선택")}</span>
                <span className="ml-2 text-xs text-muted-foreground">({LANG_LABEL[lang] ?? "한국어"})</span>
              </div>
              <MaterialSymbol name="chevron_right" size={18} weight={300} className="text-muted-foreground" />
            </button>

            {/* 일정 알림 켜기/끄기 */}
            <button
              type="button"
              role="switch"
              aria-checked={prefs.alarm}
              onClick={async () => {
                setAlarmNotice(null);
                if (prefs.alarm) {
                  setPrefs({ ...prefs, alarm: false });
                  await disablePushNotifications();
                } else {
                  const res = await enablePushNotifications();
                  if (res === "denied") {
                    setPrefs({ ...prefs, alarm: false });
                    setAlarmNotice(tr("기기 설정에서 알림 권한을 허용해 주세요"));
                  } else {
                    setPrefs({ ...prefs, alarm: true });
                  }
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted active:bg-muted/80"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-foreground/80">
                <MaterialSymbol
                  name={prefs.alarm ? "notifications_active" : "notifications_off"}
                  size={18}
                  weight={350}
                  className={prefs.alarm ? "text-primary" : ""}
                />
              </span>
              <div className="flex-1 text-left">
                <span>{tr("일정 알림")}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({prefs.alarm ? tr("켜짐") : tr("꺼짐")})
                </span>
              </div>
              <span
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                  prefs.alarm ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.alarm ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
            {alarmNotice && (
              <p className="px-3 text-xs font-medium text-destructive">{alarmNotice}</p>
            )}
          </div>
        </div>

        {/* [하단 고정 바] 내 정보 & 보관함 용량 & 아코디언 */}
        <div className="border-t border-border/70 bg-card/60 p-4 space-y-3">
          {/* 보관함 용량 게이지 */}
          <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <MaterialSymbol name="cloud" size={16} weight={350} className="text-primary" />
                {tr("보관함 용량")}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {fmtBytes(u.total)} / {fmtBytes(cap)} ({pct.toFixed(0)}%)
              </span>
            </div>
            {/* 용량 프로그레스 바 (스샷 / 문서 / 음성 색상 구분) */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted/80">
              {u.image > 0 && (
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, (u.image / cap) * 100)}%` }}
                />
              )}
              {u.doc > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (u.doc / cap) * 100)}%` }}
                />
              )}
              {u.voice > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (u.voice / cap) * 100)}%` }}
                />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{tr("보관된 서류 {0}건", notesCount)}</span>
              <button
                type="button"
                onClick={() => setStorageDetailsOpen((prev) => !prev)}
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                <span>{tr("자세히")}</span>
                <MaterialSymbol
                  name="expand_more"
                  size={15}
                  weight={350}
                  className={`transition-transform duration-200 ${storageDetailsOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* 자세히 펼침 내역 */}
            {storageDetailsOpen && (
              <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2.5 text-[11px] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between text-foreground/85">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    {tr("스샷")}
                  </span>
                  <span className="font-medium text-muted-foreground">{fmtBytes(u.image)}</span>
                </div>
                <div className="flex items-center justify-between text-foreground/85">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    {tr("문서")}
                  </span>
                  <span className="font-medium text-muted-foreground">{fmtBytes(u.doc)}</span>
                </div>
                <div className="flex items-center justify-between text-foreground/85">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    {tr("음성")}
                  </span>
                  <span className="font-medium text-muted-foreground">{fmtBytes(u.voice)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 로그인 계정 표시 및 아코디언 토글 */}
          <div className="rounded-2xl border border-border/70 bg-background/80 overflow-hidden shadow-2xs transition-all">
            <button
              type="button"
              onClick={() => setAccountAccordionOpen((prev) => !prev)}
              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
                  <MaterialSymbol name="account_circle" size={22} weight={350} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{email || tr("로그인 계정")}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {joinedAt ? tr("가입일 {0}", new Date(joinedAt).toLocaleDateString(locale())) : tr("계정 설정")}
                  </p>
                </div>
              </div>
              <MaterialSymbol
                name="expand_more"
                size={20}
                weight={300}
                className={`text-muted-foreground transition-transform duration-200 ${
                  accountAccordionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 아코디언 메뉴 내용: 로그아웃 & 회원탈퇴 */}
            {accountAccordionOpen && (
              <div className="border-t border-border/60 bg-muted/30 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-card hover:text-foreground transition-colors"
                >
                  <MaterialSymbol name="logout" size={16} weight={350} />
                  <span>{tr("로그아웃")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuitting(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <MaterialSymbol name="person_remove" size={16} weight={350} />
                  <span>{tr("회원 탈퇴")}</span>
                </button>
              </div>
            )}
          </div>

          {/* 하단 약관 및 버전 링크 */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground/80">
            <div className="flex gap-3">
              <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="hover:underline">
                {tr("이용방법")}
              </a>
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="hover:underline">
                {tr("개인정보")}
              </a>
              <a href={TERMS_URL} target="_blank" rel="noreferrer" className="hover:underline">
                {tr("이용약관")}
              </a>
            </div>
            <span>v1.1.0</span>
          </div>
        </div>
      </aside>

      {/* 테마 변경 팝업 모달 */}
      {themeModalOpen && (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setThemeModalOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-bold text-foreground text-sm">{tr("앱 테마 선택")}</span>
              <IconButton ariaLabel={tr("닫기")} onClick={() => setThemeModalOpen(false)} className="h-8 w-8">
                <MaterialSymbol name="close" size={18} weight={350} />
              </IconButton>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPrefs({ ...prefs, mode: m });
                  }}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-xs font-semibold transition-all ${
                    prefs.mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <MaterialSymbol
                    name={m === "light" ? "light_mode" : "dark_mode"}
                    size={26}
                    weight={350}
                  />
                  <span>{m === "light" ? tr("라이트 모드") : tr("다크 모드")}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-border/60 pt-3.5">
              <p className="mb-2.5 text-xs font-semibold text-muted-foreground">{tr("컬러 테마")}</p>
              <div className="grid grid-cols-4 gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setPrefs({ ...prefs, accent: a.key })}
                    className="flex flex-col items-center gap-1.5 py-1"
                  >
                    <span
                      className={`size-8 rounded-full ${a.cls} shadow-xs transition-transform ${
                        prefs.accent === a.key
                          ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    />
                    <span
                      className={`text-[10px] ${
                        prefs.accent === a.key ? "font-bold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tr(a.label)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 언어 선택 팝업 모달 */}
      {langModalOpen && (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLangModalOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-bold text-foreground text-sm">{tr("언어 선택")}</span>
              <IconButton ariaLabel={tr("닫기")} onClick={() => setLangModalOpen(false)} className="h-8 w-8">
                <MaterialSymbol name="close" size={18} weight={350} />
              </IconButton>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pt-2 pr-1">
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLang(code);
                    setLangModalOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold transition-colors ${
                    lang === code
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{LANG_LABEL[code]}</span>
                  {lang === code && <MaterialSymbol name="check" size={18} weight={400} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 (구글 플레이 구독 해지 안내 명시) */}
      {quitting && (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !quitBusy && setQuitting(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-destructive">
              <MaterialSymbol name="warning" size={24} weight={400} fill />
              <p className="text-base font-bold">{tr("정말 회원 탈퇴하시나요?")}</p>
            </div>

            <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
              {tr("탈퇴하면 저장된 메모, 캘린더 기록, 대화 내역, 사진 및 올린 파일이 즉시 영구 삭제되며 절대 복구할 수 없습니다.")}
            </p>

            {/* 구글 플레이스토어 구독 해지 안내 (대표님 요청사항) */}
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-bold flex items-center gap-1">
                <MaterialSymbol name="info" size={16} weight={400} />
                {tr("구글 플레이스토어 정기 구독 안내")}
              </p>
              <p className="mt-1 text-[11px]">
                {tr("구글 플레이스토어를 통해 정기 구독 중이신 경우, 앱을 탈퇴하셔도 구글 구독이 자동 해지되지 않습니다. 반드시 구글 플레이스토어 앱의 [결제 및 정기 결제] 메뉴에서 구독을 먼저 해지해 주세요.")}
              </p>
            </div>

            <p className="mt-3 text-xs text-foreground font-medium">
              {tr("계속하려면 {0}라고 입력해 주세요.", tr("회원탈퇴"))}
            </p>

            <input
              value={quitText}
              onChange={(e) => setQuitText(e.target.value)}
              placeholder={tr("회원탈퇴")}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-destructive"
            />

            {quitErr && <p className="mt-1.5 text-xs text-destructive">{quitErr}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={quitBusy}
                onClick={() => {
                  setQuitting(false);
                  setQuitText("");
                }}
                className="rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80"
              >
                {tr("취소")}
              </button>
              <button
                type="button"
                disabled={quitText.trim() !== tr("회원탈퇴") || quitBusy}
                onClick={async () => {
                  setQuitBusy(true);
                  setQuitErr("");
                  try {
                    await onDeleteAccount();
                  } catch {
                    setQuitErr(tr("탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
                    setQuitBusy(false);
                  }
                }}
                className="rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground disabled:opacity-40"
              >
                {quitBusy ? tr("삭제 중...") : tr("탈퇴하기")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
