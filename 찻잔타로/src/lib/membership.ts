// 결제 상태 캐시(localStorage). 포트원 설정 시 서버 지갑(wallets)이 원본이고 이 값은 동기화된 사본.
import { getWallet, grantAdTurn, spendLeafServer } from "./payment.functions";
import { portoneReady } from "./products";
import { kstDayKey } from "./access";
const KEY = "teacup-membership";

type State = { premium: boolean; leaves: number; lastDaily?: string };

export function getMembership(): State {
  if (typeof window === "undefined") return { premium: false, leaves: 0 };
  try {
    return { premium: false, leaves: 0, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { premium: false, leaves: 0 };
  }
}

export function setMembership(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const isPremium = () => getMembership().premium;

// 대화 턴 제한 (상담 1회당)
export const FREE_TURNS = 2;
export const LEAF_TURNS = 4;
export const AD_TURNS = 1;

const extraKey = (id: string) => `teacup-extra-${id}`;
export function getExtraTurns(readingId: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(extraKey(readingId)) || 0);
}
/** 지금 시점부터 n턴을 더 쓸 수 있도록 추가 턴 값을 계산 */
export function extraAfterGrant(current: number, userTurns: number, n: number) {
  return Math.max(current, userTurns - FREE_TURNS) + n;
}
export function addExtraTurns(readingId: string, n: number, userTurns = 0) {
  const next = extraAfterGrant(getExtraTurns(readingId), userTurns, n);
  localStorage.setItem(extraKey(readingId), String(next));
}
/** 찻잎 1개 사용. 성공 시 true */
export async function spendLeaf(readingId: string, userTurns = 0): Promise<boolean> {
  const s = getMembership();
  if (s.leaves < 1) return false;
  if (portoneReady()) {
    // 서버 장부에 먼저 기록해야 서버가 추가 대화를 허락한다.
    try {
      const r = await spendLeafServer({ data: { readingId } });
      setMembership({ ...getMembership(), leaves: r.leaves });
      if (!r.ok) return false;
    } catch {
      return false;
    }
  } else {
    setMembership({ ...s, leaves: s.leaves - 1 });
  }
  addExtraTurns(readingId, LEAF_TURNS, userTurns);
  return true;
}

/** 광고 보상 대화 1번 (서버 장부에 기록) */
export async function grantAdTurns(readingId: string, userTurns = 0): Promise<boolean> {
  try {
    const r = await grantAdTurn({ data: { readingId } });
    if (!r.ok) return false;
  } catch {
    return false;
  }
  addExtraTurns(readingId, AD_TURNS, userTurns);
  return true;
}
export function turnsLeft(userTurns: number, extra: number) {
  return Math.max(0, FREE_TURNS + extra - userTurns);
}

/** 서버 지갑을 로컬 캐시에 반영 (포트원 설정 시에만) */
export async function syncWallet(): Promise<State> {
  if (portoneReady()) {
    try {
      const w = await getWallet();
      setMembership({ premium: w.premium, leaves: w.leaves });
    } catch { /* 비로그인 등 */ }
  } else {
    // 체험(가상 결제) 모드: 멤버십이면 하루 한 번 찻잎 1개 지급
    const s = getMembership();
    const today = kstDayKey();
    if (s.premium && s.lastDaily !== today) setMembership({ ...s, leaves: s.leaves + 1, lastDaily: today });
  }
  return getMembership();
}
