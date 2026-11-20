// 브라우저 전용 이용 한도 규칙 (순수 함수 — 테스트 가능). 결제 없이 광고로만 추가 충전.
export const FREE_PER_DAY = 1;
export const AD_MAX_PER_DAY = 2;
export const COOLDOWN_MS = 3_000;

export type Quota = { date: string; used: number; adsWatched: number; adCredits: number; lastAt: number };
export type Check = { ok: true } | { ok: false; reason: "cooldown"; waitMs: number } | { ok: false; reason: "need-charge" | "daily-cap" };

export const today = (now: number) => {
  const d = new Date(now + 9 * 3600_000); // 한국 시간 기준 하루
  return d.toISOString().slice(0, 10);
};

export function fresh(now: number): Quota {
  return { date: today(now), used: 0, adsWatched: 0, adCredits: 0, lastAt: 0 };
}

export function normalize(q: Quota | null, now: number): Quota {
  if (!q || q.date !== today(now)) return { ...fresh(now), lastAt: q?.lastAt ?? 0 };
  const { date, used, adsWatched, adCredits, lastAt } = q;
  return { date, used, adsWatched, adCredits, lastAt };
}

export const adsLeft = (q: Quota) => Math.max(0, AD_MAX_PER_DAY - q.adsWatched);

export function check(q: Quota, now: number): Check {
  // 남은 횟수가 없으면 쿨다운과 무관하게 충전(광고/타로) 안내가 먼저다.
  if (q.used >= FREE_PER_DAY && q.adCredits <= 0) return { ok: false, reason: adsLeft(q) > 0 ? "need-charge" : "daily-cap" };
  const wait = q.lastAt + COOLDOWN_MS - now;
  if (q.used > 0 && wait > 0) return { ok: false, reason: "cooldown", waitMs: wait };
  return { ok: true };
}

export function consume(q: Quota, now: number): Quota {
  const usesCredit = q.used >= FREE_PER_DAY;
  return { ...q, used: q.used + 1, adCredits: usesCredit ? q.adCredits - 1 : q.adCredits, lastAt: now };
}

export function watchAd(q: Quota): Quota {
  if (adsLeft(q) === 0) return q;
  return { ...q, adsWatched: q.adsWatched + 1, adCredits: q.adCredits + 1 };
}

const KEY = "forest-quota";
export function loadQuota(now: number): Quota {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) ?? "null"), now); } catch { return fresh(now); }
}
export function saveQuota(q: Quota) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* ignore */ }
}
