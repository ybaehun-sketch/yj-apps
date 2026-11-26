import { sendUrgentAlert } from "./alerts.server";

export type AiKeyGroupId = "service" | "patrol" | "studio";
export type AiKeyStatus = "healthy" | "warning" | "error" | "unconfigured";

export interface AiKeyBudgetState {
  /** 이번 달 충전 금액 또는 월 상한 예산 (원) */
  monthlyBudgetKrw: number;
  /** 누적 예상 사용 금액 (원) */
  estimatedSpentKrw: number;
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
  budget: AiKeyBudgetState;
  remainingKrw: number;
  remainingPercent: number;
  budgetWarning: boolean;
}

export interface AiKeyMonitorOverview {
  groups: AiKeyGroupSnapshot[];
  totalBudgetKrw: number;
  totalSpentKrw: number;
  totalRemainingKrw: number;
  totalRemainingPercent: number;
  lastCheckedAt: string;
}

interface PersistedMonitorState {
  budgets: Record<AiKeyGroupId, AiKeyBudgetState>;
}

const DEFAULT_BUDGETS: Record<AiKeyGroupId, AiKeyBudgetState> = {
  service: {
    monthlyBudgetKrw: 7000,
    estimatedSpentKrw: 50,
    alertThresholdPercent: 20,
    updatedAt: new Date().toISOString(),
  },
  patrol: {
    monthlyBudgetKrw: 18000,
    estimatedSpentKrw: 2110,
    alertThresholdPercent: 20,
    updatedAt: new Date().toISOString(),
  },
  studio: {
    monthlyBudgetKrw: 3000,
    estimatedSpentKrw: 20,
    alertThresholdPercent: 20,
    updatedAt: new Date().toISOString(),
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
        const parsed = JSON.parse(raw) as Partial<PersistedMonitorState>;
        return {
          budgets: {
            service: { ...DEFAULT_BUDGETS.service, ...parsed.budgets?.service },
            patrol: { ...DEFAULT_BUDGETS.patrol, ...parsed.budgets?.patrol },
            studio: { ...DEFAULT_BUDGETS.studio, ...parsed.budgets?.studio },
          },
        };
      }
    } catch {
      // 파일 읽기 실패 시 메모리/기본값 폴백
    }
  }
  if (!memoryState) {
    memoryState = {
      budgets: {
        service: { ...DEFAULT_BUDGETS.service },
        patrol: { ...DEFAULT_BUDGETS.patrol },
        studio: { ...DEFAULT_BUDGETS.studio },
      },
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

export async function checkAllAiKeys(): Promise<AiKeyMonitorOverview> {
  const state = await readState();
  const nowIso = new Date().toISOString();

  const groups = await Promise.all(
    GROUP_SPECS.map(async (spec): Promise<AiKeyGroupSnapshot> => {
      const apiKey = spec.resolveKey();
      const budget = state.budgets[spec.id];
      const remainingKrw = Math.max(0, budget.monthlyBudgetKrw - budget.estimatedSpentKrw);
      const remainingPercent =
        budget.monthlyBudgetKrw > 0
          ? Math.max(0, Math.min(100, Math.round((remainingKrw / budget.monthlyBudgetKrw) * 100)))
          : 0;
      const budgetWarning = remainingPercent <= budget.alertThresholdPercent;

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
          budget,
          remainingKrw,
          remainingPercent,
          budgetWarning,
        };
      }

      const ping = await pingGeminiKeyFree(apiKey);

      if (ping.status === "error" || ping.status === "warning") {
        await sendUrgentAlert({
          appKey: `ai_key_${spec.id}`,
          appName: spec.label,
          title: ping.status === "error" ? "AI 열쇠 연결 끊김 감지" : "AI 사용 한도 주의 감지",
          message: `대상 앱: ${spec.apps.join(", ")}\n상태: ${ping.message}`,
          severity: ping.status === "error" ? "critical" : "warning",
        });
      }

      if (budgetWarning && budget.monthlyBudgetKrw > 0) {
        await sendUrgentAlert({
          appKey: `ai_budget_${spec.id}`,
          appName: spec.label,
          title: "AI 예상 잔액 부족 경고",
          message: `남은 예상 잔액: ${remainingKrw.toLocaleString()}원 (${remainingPercent}%)\n충전 예산: ${budget.monthlyBudgetKrw.toLocaleString()}원`,
          severity: remainingPercent <= 10 ? "critical" : "warning",
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
        budget,
        remainingKrw,
        remainingPercent,
        budgetWarning,
      };
    }),
  );

  const totalBudgetKrw = groups.reduce((acc, g) => acc + g.budget.monthlyBudgetKrw, 0);
  const totalSpentKrw = groups.reduce((acc, g) => acc + g.budget.estimatedSpentKrw, 0);
  const totalRemainingKrw = Math.max(0, totalBudgetKrw - totalSpentKrw);
  const totalRemainingPercent =
    totalBudgetKrw > 0 ? Math.max(0, Math.min(100, Math.round((totalRemainingKrw / totalBudgetKrw) * 100))) : 0;

  return {
    groups,
    totalBudgetKrw,
    totalSpentKrw,
    totalRemainingKrw,
    totalRemainingPercent,
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

export async function updateAiKeyBudget(
  groupId: AiKeyGroupId,
  patch: { monthlyBudgetKrw: number; estimatedSpentKrw: number; alertThresholdPercent: number },
): Promise<AiKeyBudgetState> {
  const state = await readState();
  const next: AiKeyBudgetState = {
    monthlyBudgetKrw: Math.max(0, Math.round(patch.monthlyBudgetKrw)),
    estimatedSpentKrw: Math.max(0, Math.round(patch.estimatedSpentKrw)),
    alertThresholdPercent: Math.max(5, Math.min(80, Math.round(patch.alertThresholdPercent))),
    updatedAt: new Date().toISOString(),
  };
  state.budgets[groupId] = next;
  await writeState(state);
  return next;
}

export async function recordEstimatedAiSpend(groupId: AiKeyGroupId, amountKrw: number): Promise<void> {
  if (amountKrw <= 0) return;
  const state = await readState();
  state.budgets[groupId] = {
    ...state.budgets[groupId],
    estimatedSpentKrw: state.budgets[groupId].estimatedSpentKrw + Math.round(amountKrw),
    updatedAt: new Date().toISOString(),
  };
  await writeState(state);
}
