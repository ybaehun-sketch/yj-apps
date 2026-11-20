// 정식 결제 오픈 전 비용 방어선. 관리자(운영자) 계정은 모든 제한에서 제외돼요.
export const ADMIN_EMAILS = ["ybaehun@gmail.com"];
export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export const DAILY_READINGS = 1; // 하루 무료 새 상담 수
export const DAILY_READING_ADS = 2; // 무료 상담을 쓴 뒤 광고로 새 상담을 열 수 있는 하루 횟수
export const DAILY_ADS = 3; // 하루 광고 보상 횟수
export const MAX_TURNS_PER_READING = 2 + 1 * 3; // 무료 2 + 광고 최대 3

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
