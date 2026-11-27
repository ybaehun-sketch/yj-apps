import { recordEstimatedAiSpend } from "./ai-key-monitor.server";
import type { AppStatus, TelemetryDailyRow } from "./studio-hub/types";

export interface LiveAppTelemetryInput {
  appId: string;
  date?: string | undefined; // YYYY-MM-DD 또는 MM-DD
  revenue?: number | undefined;
  dau?: number | undefined;
  aiCost?: number | undefined;
  errorCount?: number | undefined;
  status?: AppStatus | undefined;
}

export interface LiveTelemetryState {
  /** 앱별 최신 요약 (appId -> 최신 수치) */
  latestByApp: Record<
    string,
    {
      appId: string;
      status: AppStatus;
      yesterdayRevenue: number;
      dau: number;
      aiCost: number;
      errorCount: number;
      updatedAt: string;
    }
  >;
  /** 최근 일별 실적 행 (appId + date 기준 덮어쓰기) */
  dailyRows: TelemetryDailyRow[];
}

const DEFAULT_STATE: LiveTelemetryState = {
  latestByApp: {},
  dailyRows: [],
};

let memoryTelemetry: LiveTelemetryState = {
  latestByApp: {},
  dailyRows: [],
};

async function getTelemetryFilePath(): Promise<string | null> {
  if (typeof process === "undefined" || typeof process.cwd !== "function") return null;
  try {
    const path = await import("node:path");
    return path.resolve(process.cwd(), ".telemetry-live.local.json");
  } catch {
    return null;
  }
}

export async function readLiveTelemetry(): Promise<LiveTelemetryState> {
  const filePath = await getTelemetryFilePath();
  if (filePath) {
    try {
      const fs = await import("node:fs");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as Partial<LiveTelemetryState>;
        memoryTelemetry = {
          latestByApp: parsed.latestByApp ?? {},
          dailyRows: Array.isArray(parsed.dailyRows) ? parsed.dailyRows : [],
        };
        return memoryTelemetry;
      }
    } catch {
      // 읽기 실패 시 메모리 폴백
    }
  }
  return memoryTelemetry;
}

async function writeLiveTelemetry(state: LiveTelemetryState): Promise<void> {
  memoryTelemetry = state;
  const filePath = await getTelemetryFilePath();
  if (filePath) {
    try {
      const fs = await import("node:fs");
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // 읽기 전용 환경에서는 메모리만 유지
    }
  }
}

function normalizeMmDd(input?: string): string {
  if (input && /^\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  if (input && /^\d{4}-\d{2}-\d{2}/.test(input.trim())) {
    return input.trim().slice(5, 10);
  }
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

export async function ingestAppTelemetry(input: LiveAppTelemetryInput): Promise<{
  ok: true;
  appId: string;
  date: string;
}> {
  const state = await readLiveTelemetry();
  const dateMmDd = normalizeMmDd(input.date);

  const prev = state.latestByApp[input.appId];
  const revenue = Math.max(0, Math.round(input.revenue ?? prev?.yesterdayRevenue ?? 0));
  const dau = Math.max(0, Math.round(input.dau ?? prev?.dau ?? 0));
  const aiCost = Math.max(0, Math.round(input.aiCost ?? prev?.aiCost ?? 0));
  const errorCount = Math.max(0, Math.round(input.errorCount ?? prev?.errorCount ?? 0));
  const status: AppStatus =
    input.status ?? (errorCount >= 10 ? "critical" : errorCount > 0 ? "warning" : "normal");

  const prevDaily = state.dailyRows.find(
    (r) => r.appId === input.appId && r.date === dateMmDd,
  );
  const aiCostDelta = Math.max(0, aiCost - (prevDaily?.aiCost ?? 0));

  state.latestByApp[input.appId] = {
    appId: input.appId,
    status,
    yesterdayRevenue: revenue,
    dau,
    aiCost,
    errorCount,
    updatedAt: new Date().toISOString(),
  };

  const nextRow: TelemetryDailyRow = {
    appId: input.appId,
    date: dateMmDd,
    revenue,
    dau,
    aiCost,
    errorCount,
  };

  const filtered = state.dailyRows.filter(
    (r) => !(r.appId === input.appId && r.date === dateMmDd),
  );
  filtered.push(nextRow);
  filtered.sort((a, b) => a.date.localeCompare(b.date));
  state.dailyRows = filtered.slice(-140);

  await writeLiveTelemetry(state);

  // 고객 서비스용 앱(톡비서·오답정복 등)에서 보고된 AI 비용 증가분은 공동 지갑 사용량에도 반영
  if (aiCostDelta > 0) {
    const groupId = input.appId === "ul_dongne" ? "patrol" : "service";
    await recordEstimatedAiSpend(groupId, aiCostDelta);
  }

  return { ok: true, appId: input.appId, date: dateMmDd };
}
