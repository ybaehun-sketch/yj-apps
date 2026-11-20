export const DAILY_LIMIT = 3;
const KEY = "kkumsoban-daily-uses";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getUsedToday(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    return raw?.date === today() ? Number(raw.count) || 0 : 0;
  } catch { return 0; }
}

export function recordUse(): number {
  const n = getUsedToday() + 1;
  try { localStorage.setItem(KEY, JSON.stringify({ date: today(), count: n })); } catch { /* ignore */ }
  return n;
}
