import { sendUrgentAlert } from "./alerts.server";

export type AiKeyGroupId = "service" | "patrol" | "studio";
export type AiKeyStatus = "healthy" | "warning" | "error" | "unconfigured";

export interface SharedWalletState {
  /** 구글 AI 공통 충전 금액 또는 월 상한 예산 (원) */
  monthlyBudgetKrw: number;
  /** 잔액 경고 기준 (남은 비율 %, 기본 20) */
  alertThresholdPercent: number;
  /** 마지막 업데이트 시각 */
  updatedAt: string;
}

export interface AiKeyGroupSnapshot {
  id: AiKeyGroupId;
  label: string;
  description: string;
  apps: string[];
  envNames: string[];
  configured: boolean;
  keyMasked: string | null;
  status: AiKeyStatus;
  statusMessage: string;
  latencyMs: number | null;
  checkedAt: string;
  /** 이 열쇠가 이번 달 사용한 예상 금액 (원) */
  spentKrw: number;
  /** 전체 AI 사용량 중 이 열쇠의 비중 (%) */
  spentSharePercent: number;
}

export interface AiKeyMonitorOverview {
  groups: AiKeyGroupSnapshot[];
  sharedWallet: SharedWalletState;
  totalBudgetKrw: number;
  totalSpentKrw: number;
  totalRemainingKrw: number;
  totalRemainingPercent: number;
  budgetWarning: boolean;
  lastCheckedAt: string;
}

interface PersistedMonitorState {
  sharedWallet: SharedWalletState;
  spentByGroup: Record<AiKeyGroupId, number>;
}

const DEFAULT_STATE: PersistedMonitorState = {
  sharedWallet: {
    monthlyBudgetKrw: 28000,
    alertThresholdPercent: 20,
    updatedAt: new Date().toISOString(),
  },
  spentByGroup: {
    service: 50,
    patrol: 2110,
    studio: 20,
  },
};

let memoryState: PersistedMonitorState | null = null;

async function getStateFilePath(): Promise<string | null> {
  if (typeof process === "undefined" || typeof process.cwd !== "function") return null;
  try {
    const path = await import("node:path");
    return path.resolve(process.cwd(), ".ai-key-monitor.local.json");
  } catch {
    return null;
  }
}

async function readState(): Promise<PersistedMonitorState> {
  const filePath = await getStateFilePath();
  if (filePath) {
    try {
      const fs = await import("node:fs");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as Partial<PersistedMonitorState> & {
          budgets?: Partial<Record<AiKeyGroupId, { monthlyBudgetKrw?: number; estimatedSpentKrw?: number; alertThresholdPercent?: number }>>;
        };

        // 기존 열쇠별 예산 파일이 남아 있으면 공동 지갑으로 자연스럽게 합산 이전
        if (!parsed.sharedWallet && parsed.budgets) {
          const sumBudget =
            (parsed.budgets.service?.monthlyBudgetKrw ?? 7000) +
            (parsed.budgets.patrol?.monthlyBudgetKrw ?? 18000) +
            (parsed.budgets.studio?.monthlyBudgetKrw ?? 3000);
          return {
            sharedWallet: {
              monthlyBudgetKrw: sumBudget,
              alertThresholdPercent: parsed.budgets.service?.alertThresholdPercent ?? 20,
              updatedAt: new Date().toISOString(),
            },
            spentByGroup: {
              service: parsed.budgets.service?.estimatedSpentKrw ?? DEFAULT_STATE.spentByGroup.service,
              patrol: parsed.budgets.patrol?.estimatedSpentKrw ?? DEFAULT_STATE.spentByGroup.patrol,
              studio: parsed.budgets.studio?.estimatedSpentKrw ?? DEFAULT_STATE.spentByGroup.studio,
            },
          };
        }

        return {
          sharedWallet: {
            ...DEFAULT_STATE.sharedWallet,
            ...parsed.sharedWallet,
          },
          spentByGroup: {
            ...DEFAULT_STATE.spentByGroup,
            ...parsed.spentByGroup,
          },
        };
      }
    } catch {
      // 파일 읽기 실패 시 메모리/기본값 폴백
    }
  }
  if (!memoryState) {
    memoryState = {
      sharedWallet: { ...DEFAULT_STATE.sharedWallet },
      spentByGroup: { ...DEFAULT_STATE.spentByGroup },
    };
  }
  return memoryState;
}

async function writeState(state: PersistedMonitorState): Promise<void> {
  memoryState = state;
  const filePath = await getStateFilePath();
  if (filePath) {
    try {
      const fs = await import("node:fs");
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // 읽기 전용/서버리스 환경에서는 메모리 상태만 유지
    }
  }
}

function maskKey(key: string | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (trimmed.length <= 10) return "****";
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

interface GroupSpec {
  id: AiKeyGroupId;
  label: string;
  description: string;
  apps: string[];
  envNames: string[];
  resolveKey: () => string | undefined;
}

const GROUP_SPECS: GroupSpec[] = [
  {
    id: "service",
    label: "고객 서비스용 AI",
    description: "실제 고객이 앱에서 AI 응답을 받을 때 사용하는 열쇠",
    apps: ["찻잔타로", "꿈소반", "대나무속풀이", "톡비서"],
    envNames: ["GEMINI_SERVICE_API_KEY", "GEMINI_API_KEY"],
    resolveKey: () => process.env["GEMINI_SERVICE_API_KEY"] || process.env["GEMINI_API_KEY"],
  },
  {
    id: "patrol",
    label: "울동네 자동 순찰용 AI",
    description: "새벽·낮 복지 공고 스캔 및 블로그 초안 자동 생성 전용 열쇠",
    apps: ["울동네 순찰대"],
    envNames: ["GEMINI_PATROL_API_KEY"],
    resolveKey: () => process.env["GEMINI_PATROL_API_KEY"],
  },
  {
    id: "studio",
    label: "대표님 글작성·관리용 AI",
    description: "통합 관제소에서 블로그 초안을 직접 생성할 때 쓰는 열쇠",
    apps: ["회사홈페이지 관제소"],
    envNames: ["GEMINI_STUDIO_API_KEY", "GEMINI_API_KEY"],
    resolveKey: () => process.env["GEMINI_STUDIO_API_KEY"] || process.env["GEMINI_API_KEY"],
  },
];

async function pingGeminiKeyFree(apiKey: string): Promise<{
  status: AiKeyStatus;
  message: string;
  latencyMs: number;
}> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    // AI 생성 비용 0원: 모델 목록 1건만 가볍게 확인해 열쇠 유효성과 연결 상태 점검
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey.trim())}`,
      { method: "GET", signal: controller.signal },
    );
    const latencyMs = Date.now() - started;

    if (res.ok) {
      return { status: "healthy", message: "신호 정상 (연결 양호)", latencyMs };
    }
    if (res.status === 429) {
      return { status: "warning", message: "사용 한도 주의 (일시 제한 상태)", latencyMs };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { status: "error", message: `열쇠 오류 또는 권한 만료 (코드 ${res.status})`, latencyMs };
    }
    return { status: "warning", message: `외부 응답 지연 (코드 ${res.status})`, latencyMs };
  } catch {
    return {
      status: "error",
      message: "구글 AI 서버와 연결되지 않습니다 (네트워크 또는 시간 초과)",
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

const SERVICE_LIVE_ENDPOINTS = [
  { name: "찻잔타로", url: "https://teacuptarot.com/api/health/ai" },
  { name: "꿈소반", url: "https://dreamsoban.app/api/health/ai" },
  { name: "대나무속풀이", url: "https://bambooforest.app/api/health/ai" },
] as const;

async function checkServiceLiveApps(): Promise<{ ok: boolean; failedApps: string[] }> {
  const results = await Promise.all(
    SERVICE_LIVE_ENDPOINTS.map(async (target) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(target.url, { method: "GET", signal: controller.signal });
        if (!res.ok) return target.name;
        const data = (await res.json()) as { ok?: boolean };
        return data.ok === true ? null : target.name;
      } catch {
        return target.name;
      } finally {
        clearTimeout(timer);
      }
    }),
  );
  const failedApps = results.filter((name): name is string => Boolean(name));
  return { ok: failedApps.length === 0, failedApps };
}

export async function checkAllAiKeys(): Promise<AiKeyMonitorOverview> {
  const state = await readState();
  const nowIso = new Date().toISOString();
  const totalSpentKrw = Object.values(state.spentByGroup).reduce((acc, v) => acc + Math.max(0, v), 0);

  const groups = await Promise.all(
    GROUP_SPECS.map(async (spec): Promise<AiKeyGroupSnapshot> => {
      const apiKey = spec.resolveKey();
      const spentKrw = Math.max(0, state.spentByGroup[spec.id] ?? 0);
      const spentSharePercent =
        totalSpentKrw > 0 ? Math.max(0, Math.min(100, Math.round((spentKrw / totalSpentKrw) * 100))) : 0;

      if (!apiKey) {
        return {
          id: spec.id,
          label: spec.label,
          description: spec.description,
          apps: spec.apps,
          envNames: spec.envNames,
          configured: false,
          keyMasked: null,
          status: "unconfigured",
          statusMessage: "아직 열쇠가 연결되지 않았습니다.",
          latencyMs: null,
          checkedAt: nowIso,
          spentKrw,
          spentSharePercent,
        };
      }

      let ping = await pingGeminiKeyFree(apiKey);
      if (spec.id === "service" && ping.status === "healthy") {
        const liveCheck = await checkServiceLiveApps();
        if (!liveCheck.ok) {
          ping = {
            status: "error",
            message: `실서비스 AI 연결 이상 (${liveCheck.failedApps.join(", ")})`,
            latencyMs: ping.latencyMs,
          };
        } else {
          ping = {
            status: "healthy",
            message: "신호 정상 (3개 실서비스 포함 연결 양호)",
            latencyMs: ping.latencyMs,
          };
        }
      }

      if (ping.status === "error" || ping.status === "warning") {
        await sendUrgentAlert({
          appKey: `ai_key_${spec.id}`,
          appName: spec.label,
          title: ping.status === "error" ? "AI 열쇠 연결 끊김 감지" : "AI 사용 한도 주의 감지",
          message: `대상 앱: ${spec.apps.join(", ")}\n상태: ${ping.message}`,
          severity: ping.status === "error" ? "critical" : "warning",
        });
      }

      return {
        id: spec.id,
        label: spec.label,
        description: spec.description,
        apps: spec.apps,
        envNames: spec.envNames,
        configured: true,
        keyMasked: maskKey(apiKey),
        status: ping.status,
        statusMessage: ping.message,
        latencyMs: ping.latencyMs,
        checkedAt: nowIso,
        spentKrw,
        spentSharePercent,
      };
    }),
  );

  const totalBudgetKrw = state.sharedWallet.monthlyBudgetKrw;
  const totalRemainingKrw = Math.max(0, totalBudgetKrw - totalSpentKrw);
  const totalRemainingPercent =
    totalBudgetKrw > 0 ? Math.max(0, Math.min(100, Math.round((totalRemainingKrw / totalBudgetKrw) * 100))) : 0;
  const budgetWarning =
    totalBudgetKrw > 0 && totalRemainingPercent <= state.sharedWallet.alertThresholdPercent;

  if (budgetWarning) {
    await sendUrgentAlert({
      appKey: "ai_budget_shared",
      appName: "구글 AI 공동 지갑",
      title: "AI 공동 예상 잔액 부족 경고",
      message: `남은 예상 잔액: ${totalRemainingKrw.toLocaleString()}원 (${totalRemainingPercent}%)\n공동 충전 예산: ${totalBudgetKrw.toLocaleString()}원`,
      severity: totalRemainingPercent <= 10 ? "critical" : "warning",
    });
  }

  return {
    groups,
    sharedWallet: state.sharedWallet,
    totalBudgetKrw,
    totalSpentKrw,
    totalRemainingKrw,
    totalRemainingPercent,
    budgetWarning,
    lastCheckedAt: nowIso,
  };
}

export async function runDeepAiKeyTest(groupId: AiKeyGroupId): Promise<{
  ok: boolean;
  status: AiKeyStatus;
  message: string;
  latencyMs: number;
}> {
  const spec = GROUP_SPECS.find((g) => g.id === groupId);
  if (!spec) {
    return { ok: false, status: "error", message: "알 수 없는 열쇠 그룹입니다.", latencyMs: 0 };
  }
  const apiKey = spec.resolveKey();
  if (!apiKey) {
    return { ok: false, status: "unconfigured", message: "열쇠가 설정되어 있지 않습니다.", latencyMs: 0 };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: "OK" }] }],
          generationConfig: { maxOutputTokens: 4 },
        }),
      },
    );
    const latencyMs = Date.now() - started;
    if (res.ok) {
      await recordEstimatedAiSpend(groupId, 1);
      return { ok: true, status: "healthy", message: "실제 AI 응답 테스트 성공!", latencyMs };
    }
    if (res.status === 429) {
      return { ok: false, status: "warning", message: "오늘 사용 한도가 초과되었거나 요청이 몰렸습니다.", latencyMs };
    }
    return { ok: false, status: "error", message: `AI 응답 테스트 실패 (코드 ${res.status})`, latencyMs };
  } catch {
    return {
      ok: false,
      status: "error",
      message: "AI 서버와 통신 중 시간 초과 또는 네트워크 오류가 발생했습니다.",
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function updateSharedAiWallet(patch: {
  monthlyBudgetKrw: number;
  alertThresholdPercent: number;
}): Promise<SharedWalletState> {
  const state = await readState();
  const next: SharedWalletState = {
    monthlyBudgetKrw: Math.max(0, Math.round(patch.monthlyBudgetKrw)),
    alertThresholdPercent: Math.max(5, Math.min(80, Math.round(patch.alertThresholdPercent))),
    updatedAt: new Date().toISOString(),
  };
  state.sharedWallet = next;
  await writeState(state);
  return next;
}

export async function updateAiKeySpent(groupId: AiKeyGroupId, estimatedSpentKrw: number): Promise<number> {
  const state = await readState();
  const nextSpent = Math.max(0, Math.round(estimatedSpentKrw));
  state.spentByGroup[groupId] = nextSpent;
  await writeState(state);
  return nextSpent;
}

export async function recordEstimatedAiSpend(groupId: AiKeyGroupId, amountKrw: number): Promise<void> {
  if (amountKrw <= 0) return;
  const state = await readState();
  state.spentByGroup[groupId] = (state.spentByGroup[groupId] ?? 0) + Math.round(amountKrw);
  await writeState(state);
}
