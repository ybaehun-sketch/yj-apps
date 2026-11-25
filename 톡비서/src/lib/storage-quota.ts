// 플랜별 저장 용량 정책 (순수 함수 — 테스트 가능)
export type QuotaPlan = "free" | "premium";

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const QUOTA_BYTES: Record<QuotaPlan, number> = { free: 100 * MB, premium: 20 * GB };
export const DAILY_AI_LIMIT: Record<QuotaPlan, number> = { free: 20, premium: 50 };
export const FREE_TRIAL_DAYS = 7;
export const MAX_FILE_BYTES: Record<QuotaPlan, number> = { free: 20 * MB, premium: 50 * MB };

export function trialDaysLeft(joinedAt: string | null, now = new Date()): number {
  if (!joinedAt) return FREE_TRIAL_DAYS;
  const end = new Date(joinedAt).getTime() + FREE_TRIAL_DAYS * 86400000;
  return Math.max(0, Math.ceil((end - now.getTime()) / 86400000));
}

/** 하루 AI 호출 횟수 제한 도달 시 안내 문구 반환 */
export function dailyLimitReason(plan: QuotaPlan, todayCount: number): string | null {
  const limit = DAILY_AI_LIMIT[plan];
  if (todayCount < limit) return null;
  return plan === "free"
    ? "오늘 무료 AI 정리 20회를 모두 썼어요. 프리미엄(하루 50회)으로 업그레이드해 보세요"
    : "오늘 AI 정리 50회(공정 사용)를 모두 썼어요. 내일 다시 이용해 주세요";
}

/** 업로드 가능하면 null, 아니면 사용자에게 보여줄 안내 문구 */
export function uploadBlockReason(plan: QuotaPlan, joinedAt: string | null, usedBytes: number, fileBytes: number, now = new Date(), checkTrial = true): string | null {
  if (fileBytes > MAX_FILE_BYTES[plan]) {
    return plan === "free"
      ? "무료 회원은 파일 하나당 최대 20MB까지 올릴 수 있어요 (프리미엄 50MB)"
      : "파일 하나는 최대 50MB까지 올릴 수 있어요";
  }
  if (checkTrial && plan === "free" && trialDaysLeft(joinedAt, now) === 0) return "무료 체험 7일이 끝났어요. 프리미엄으로 업그레이드하면 계속 보관할 수 있어요";
  if (usedBytes + fileBytes > QUOTA_BYTES[plan]) return plan === "free"
    ? "무료 보관함 100MB가 가득 찼어요. 프리미엄으로 20GB를 써보세요"
    : "보관함이 가득 찼어요. 안 쓰는 파일을 지워 주세요";
  return null;
}

export function fmtBytes(b: number): string {
  if (b >= GB) return `${(b / GB).toFixed(1)}GB`;
  if (b >= MB) return `${(b / MB).toFixed(1)}MB`;
  return `${Math.round(b / 1024)}KB`;
}

export type Usage = { image: number; doc: number; voice: number; total: number };
export function sumUsage(files: { name: string; size: number }[]): Usage {
  const u: Usage = { image: 0, doc: 0, voice: 0, total: 0 };
  for (const f of files) {
    const k = f.name.startsWith("voice-") ? "voice" : f.name.startsWith("doc-") ? "doc" : "image";
    u[k] += f.size; u.total += f.size;
  }
  return u;
}
