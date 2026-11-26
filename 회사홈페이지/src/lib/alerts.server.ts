// 긴급 알림 발송 엔진 (이메일 + 텔레그램 조합 틀 구현 — 추후 환경변수 연결 시 즉시 가동)
export type AlertSeverity = "critical" | "warning" | "info";

export interface UrgentAlertPayload {
  appKey: string;
  appName: string;
  title: string;
  message: string;
  severity: AlertSeverity;
}

export interface AlertChannelStatus {
  emailConfigured: boolean;
  telegramConfigured: boolean;
  emailToMasked: string | null;
}

export interface RecordedAlert extends UrgentAlertPayload {
  receivedAt: string;
}

const lastSentMap = new Map<string, number>();
const recentAlerts: RecordedAlert[] = [];
const MAX_RECENT_ALERTS = 30;
const COOLDOWN_MS = 60 * 60 * 1000; // 같은 앱/제목 경보는 1시간 쿨타임

export function listRecentAlerts(): RecordedAlert[] {
  return [...recentAlerts];
}

export function getAlertChannelStatus(): AlertChannelStatus {
  const emailTo = process.env["ALERT_EMAIL_TO"] || "";
  const resendKey = process.env["RESEND_API_KEY"] || "";
  const tgToken = process.env["TELEGRAM_BOT_TOKEN"] || "";
  const tgChatId = process.env["TELEGRAM_CHAT_ID"] || "";

  return {
    emailConfigured: Boolean(emailTo && resendKey),
    telegramConfigured: Boolean(tgToken && tgChatId),
    emailToMasked: emailTo ? emailTo.replace(/(.{2}).*(@.*)/, "$1***$2") : null,
  };
}

export async function sendUrgentAlert(
  payload: UrgentAlertPayload,
  options?: { bypassCooldown?: boolean },
): Promise<{
  sentEmail: boolean;
  sentTelegram: boolean;
  skippedCooldown?: boolean;
  notes: string[];
}> {
  recentAlerts.unshift({ ...payload, receivedAt: new Date().toISOString() });
  if (recentAlerts.length > MAX_RECENT_ALERTS) {
    recentAlerts.length = MAX_RECENT_ALERTS;
  }

  const dedupeKey = `${payload.appKey}:${payload.title}`;
  const now = Date.now();
  const prev = lastSentMap.get(dedupeKey) ?? 0;

  if (!options?.bypassCooldown && now - prev < COOLDOWN_MS) {
    return {
      sentEmail: false,
      sentTelegram: false,
      skippedCooldown: true,
      notes: ["최근 1시간 이내에 동일한 경보를 이미 발송해 중복 발송을 건너뛰었습니다."],
    };
  }

  const notes: string[] = [];
  let sentEmail = false;
  let sentTelegram = false;

  const badge = payload.severity === "critical" ? "🚨 [긴급]" : payload.severity === "warning" ? "⚠️ [주의]" : "ℹ️ [알림]";
  const fullText = `${badge} [${payload.appName}] ${payload.title}\n\n${payload.message}\n\n발생 시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;

  // 1) 이메일 발송 (Resend)
  const emailTo = process.env["ALERT_EMAIL_TO"];
  const resendKey = process.env["RESEND_API_KEY"];
  const emailFrom = process.env["ALERT_EMAIL_FROM"] || "YJ Studio Control <onboarding@resend.dev>";

  if (emailTo && resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [emailTo],
          subject: `${badge} [YJ 스튜디오] ${payload.appName} — ${payload.title}`,
          text: fullText,
        }),
      });
      if (res.ok) {
        sentEmail = true;
        notes.push("이메일 경보를 발송했습니다.");
      } else {
        notes.push(`이메일 발송 응답 오류(${res.status})`);
      }
    } catch {
      notes.push("이메일 발송 중 네트워크 오류가 발생했습니다.");
    }
  } else {
    notes.push("이메일 알림 열쇠(ALERT_EMAIL_TO, RESEND_API_KEY)가 아직 등록되지 않아 대기 중입니다.");
  }

  // 2) 텔레그램 봇 발송
  const tgToken = process.env["TELEGRAM_BOT_TOKEN"];
  const tgChatId = process.env["TELEGRAM_CHAT_ID"];

  if (tgToken && tgChatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: fullText,
        }),
      });
      if (res.ok) {
        sentTelegram = true;
        notes.push("텔레그램 경보를 발송했습니다.");
      } else {
        notes.push(`텔레그램 발송 응답 오류(${res.status})`);
      }
    } catch {
      notes.push("텔레그램 발송 중 네트워크 오류가 발생했습니다.");
    }
  } else {
    notes.push("텔레그램 알림 열쇠(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)가 아직 등록되지 않아 대기 중입니다.");
  }

  if (sentEmail || sentTelegram) {
    lastSentMap.set(dedupeKey, now);
  }

  return { sentEmail, sentTelegram, notes };
}
