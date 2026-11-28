// 광고 전용 수익화 모드 (결제 UI 숨김 · 추후 유료 결제 재개 시 false로 전환)
export const AD_ONLY_MODE = true;
// 애드센스 정식 승인 전에는 광고 안내를 숨기고 "오늘 무료 한도를 모두 사용했습니다."만 안내 (승인 후 true로 전환)
export const ADSENSE_APPROVED = false;

// 정식 결제 오픈 전/무결제 광고 운영 비용 방어선. 관리자(운영자) 계정은 모든 제한에서 제외돼요.
export const ADMIN_EMAILS = ["ybaehun@gmail.com"];
export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export const DAILY_READINGS = 1; // 하루 무료 새 상담 수
export const DAILY_READING_ADS = 0; // 애드센스 심사 전 하루 1회 제한 (심사 후 추가 상담 오픈 시 3으로 복원)
export const DAILY_ADS = 0; // 애드센스 심사 전 추가 대화 제한 (심사 후 5로 복원)
export const MAX_TURNS_PER_READING = 2 + 2 * DAILY_ADS; // 무료 2턴 (심사 후 추가 대화 오픈 시 12턴)

/** 한국 시각 기준 오늘 0시(UTC ISO) */
export function kstDayStartISO(now = new Date()) {
  const k = new Date(now.getTime() + 9 * 3600_000);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - 9 * 3600_000).toISOString();
}
export const kstDayKey = (now = new Date()) => kstDayStartISO(now).slice(0, 10);

const adKey = () => `teacup-ads-${kstDayKey()}`;
export function adsLeftToday(): number {
  if (typeof window === "undefined") return DAILY_ADS;
  return Math.max(0, DAILY_ADS - Number(localStorage.getItem(adKey()) || 0));
}
export function recordAdWatched() {
  localStorage.setItem(adKey(), String(DAILY_ADS - adsLeftToday() + 1));
}
