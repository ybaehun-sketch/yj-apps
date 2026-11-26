export interface AiFailureDiagnosis {
  code: string;
  label: string;
  actionHint: string;
}

const INCIDENT_COOLDOWN_MS = 10 * 60 * 1000;
const lastIncidentAt = new Map<string, number>();

/**
 * Classify an AI provider error into a concise Korean diagnosis for the control center.
 */
export function classifyAiFailureReason(error: unknown): AiFailureDiagnosis {
  if (!error) {
    return {
      code: "missing_or_empty",
      label: "AI 열쇠 미설정 또는 빈 응답",
      actionHint: "AI 열쇠 설정 및 응답 상태를 확인해 주세요.",
    };
  }
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  const msg = String(
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: unknown }).message
      : error,
  );

  if (status === 429 || /\b429\b|rate.?limit|quota|resource.?exhausted|insufficient_quota/i.test(msg)) {
    return {
      code: "quota_exhausted",
      label: "할당량 또는 잔액 소진",
      actionHint: "AI 결제 한도 또는 무료 할당량을 확인해 주세요.",
    };
  }
  if (/location|country|region|not supported/i.test(msg)) {
    return {
      code: "region_blocked",
      label: "지역 또는 우회 통로 차단",
      actionHint: "미국 우회 프록시(GEMINI_PROXY) 연결 상태를 확인해 주세요.",
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    /\b401\b|\b403\b|api.?key|invalid.?key|permission.?denied|unauthorized|incorrect api key/i.test(msg)
  ) {
    return {
      code: "invalid_key",
      label: "AI 열쇠 만료 또는 권한 오류",
      actionHint: "AI 열쇠가 유효한지 확인해 주세요.",
    };
  }
  if (/timeout|timed out|abort/i.test(msg)) {
    return {
      code: "timeout",
      label: "응답 시간 초과(일시 지연)",
      actionHint: "일시적 혼잡일 수 있습니다. 지속되면 AI 서버 상태를 확인해 주세요.",
    };
  }
  return {
    code: "unknown",
    label: "일시적 AI 연결 오류",
    actionHint: "톡비서 서버 로그와 AI 상태를 확인해 주세요.",
  };
}

/** Clear incident cooldowns (intended for tests). */
export function resetIncidentCooldowns(): void {
  lastIncidentAt.clear();
}

/**
 * Send a rate-limited incident alert to the company control center if configured.
 * Never throws so user-facing note flows are never blocked.
 */
export async function reportAiIncident(opts: {
  severity: "warning" | "critical";
  title: string;
  message: string;
  dedupeKey: string;
}): Promise<boolean> {
  const now = Date.now();
  const prev = lastIncidentAt.get(opts.dedupeKey) ?? 0;
  if (now - prev < INCIDENT_COOLDOWN_MS) {
    return false;
  }
  lastIncidentAt.set(opts.dedupeKey, now);

  const url = process.env["CONTROL_CENTER_ALERT_URL"]?.trim();
  if (!url) {
    console.warn("[ai-incident] control center URL not configured", {
      severity: opts.severity,
      title: opts.title,
    });
    return false;
  }

  const token = process.env["CONTROL_CENTER_ALERT_TOKEN"]?.trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-alert-token": token } : {}),
      },
      body: JSON.stringify({
        appKey: "tokbiseo",
        appName: "톡비서",
        severity: opts.severity,
        title: opts.title,
        message: opts.message,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("[ai-incident] control center rejected alert", { status: res.status });
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[ai-incident] failed to notify control center", e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
