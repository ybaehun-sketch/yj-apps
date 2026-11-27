import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { supabaseAdmin } from "./integrations/supabase/client.server";
import { checkGeminiHealth } from "./lib/gemini.server";
import { sendWebPush, type PushSubscriptionData } from "./lib/web-push.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function applyEnv(env: unknown) {
  if (env && typeof env === "object") {
    const proxy = (env as { GEMINI_PROXY?: unknown }).GEMINI_PROXY;
    if (proxy && typeof (proxy as { fetch?: unknown }).fetch === "function") {
      (globalThis as { __GEMINI_PROXY__?: unknown }).__GEMINI_PROXY__ = proxy;
    }
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string" && !process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

async function dispatchDueReminders() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  const admin = supabaseAdmin;
  const nowIso = new Date().toISOString();
  const { data: dueNotes, error } = await admin
    .from("notes")
    .select("id, user_id, summary, remind_message, remind_at")
    .eq("confirmed", true)
    .eq("reminded", false)
    .not("remind_at", "is", null)
    .lte("remind_at", nowIso)
    .limit(50);

  if (error || !dueNotes?.length) return;

  const userCache = new Map<string, { enabled: boolean; subs: PushSubscriptionData[] }>();
  const vapid = { publicKey, privateKey, subject: "mailto:ybaehun@gmail.com" };

  for (const note of dueNotes) {
    let info = userCache.get(note.user_id);
    if (!info) {
      const { data: uData } = await admin.auth.admin.getUserById(note.user_id);
      const meta = (uData.user?.user_metadata ?? {}) as {
        push_enabled?: boolean;
        push_subscriptions?: PushSubscriptionData[];
      };
      info = {
        enabled: meta.push_enabled !== false,
        subs: Array.isArray(meta.push_subscriptions) ? meta.push_subscriptions : [],
      };
      userCache.set(note.user_id, info);
    }

    if (info.enabled && info.subs.length > 0) {
      const expiredEndpoints = new Set<string>();
      const bodyText = note.remind_message || note.summary;
      await Promise.all(
        info.subs.map(async (sub) => {
          try {
            const res = await sendWebPush(
              sub,
              { title: "톡비서 알림", body: bodyText, tag: `note-${note.id}`, url: "/inbox" },
              vapid,
            );
            if (res.expired) expiredEndpoints.add(sub.endpoint);
          } catch (e) {
            console.error("Web push send failed", e);
          }
        }),
      );
      if (expiredEndpoints.size > 0) {
        const remaining = info.subs.filter((s) => !expiredEndpoints.has(s.endpoint));
        info.subs = remaining;
        await admin.auth.admin.updateUserById(note.user_id, {
          user_metadata: { push_enabled: info.enabled, push_subscriptions: remaining },
        });
      }
    }

    await admin.from("notes").update({ reminded: true }).eq("id", note.id);
  }
}

async function findAdminUser(adminEmail: string) {
  const admin = supabaseAdmin;
  const adminUserId = (process.env["ADMIN_USER_ID"] || "").trim();
  if (adminUserId) {
    const { data, error } = await admin.auth.admin.getUserById(adminUserId);
    if (!error && data.user) return data.user;
  }

  const perPage = 200;
  for (let page = 1; page <= 100; page++) {
    const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr || !usersData.users.length) return null;
    const found = usersData.users.find((u) => u.email?.toLowerCase() === adminEmail);
    if (found) return found;
    if (usersData.users.length < perPage) return null;
  }
  return null;
}

async function runDailyAiHealthCheck() {
  const adminEmail = (process.env["ADMIN_ALERT_EMAIL"] || "ybaehun@gmail.com").trim().toLowerCase();
  const todayKst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const admin = supabaseAdmin;

  const adminUser = await findAdminUser(adminEmail);
  if (!adminUser) return;

  const meta = (adminUser.user_metadata ?? {}) as Record<string, unknown> & {
    last_ai_health_date?: string;
    push_subscriptions?: PushSubscriptionData[];
  };
  if (meta.last_ai_health_date === todayKst) return;

  const health = await checkGeminiHealth();
  await admin.auth.admin.updateUserById(adminUser.id, {
    user_metadata: { ...meta, last_ai_health_date: todayKst },
  });

  // 1순위 정상 응답이면 조용히 통과; 예비 모델로 넘어갔거나 전체 실패 시에만 대표님께 푸시 알림 발송
  if (health.ok && health.failedModels.length === 0) return;

  const alertBody = health.ok
    ? `기본 AI(${health.primaryModel}) 응답이 끊겨 예비 AI(${health.activeModel})로 작동 중입니다. 설정을 확인해 주세요.`
    : "톡비서 AI 전체가 응답하지 않고 있습니다. 크레딧 잔액이나 구글 AI 상태를 바로 확인해 주세요.";
  console.error("AI daily health check alert:", alertBody, health);

  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subs = Array.isArray(meta.push_subscriptions) ? meta.push_subscriptions : [];
  if (!publicKey || !privateKey || subs.length === 0) return;

  const vapid = { publicKey, privateKey, subject: `mailto:${adminEmail}` };
  await Promise.all(
    subs.map((sub) =>
      sendWebPush(
        sub,
        { title: "⚠️ 톡비서 AI 긴급 점검 알림", body: alertBody, tag: `ai-health-${todayKst}`, url: "/inbox" },
        vapid,
      ).catch((e) => console.error("Health alert push failed", e)),
    ),
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    applyEnv(env);
    const reqUrl = new URL(request.url);
const LATEST_STORE_VERSION = "1.0.2.0";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.yjstudio.tokbiseo";

type MajorUpdatePopup = {
  id: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
};

// 작은 패치 수정 시에는 null 유지 (팝업 없음).
// 큰 업데이트 안내가 필요할 때만 id를 새 값(예: "2026-11-28-v1.1")으로 채워 배포하면 사용자당 1회 팝업이 뜹니다.
const MAJOR_UPDATE_POPUP: MajorUpdatePopup | null = null;

    if (reqUrl.pathname === "/api/warmup") {
      try {
        const proxy = (env as { GEMINI_PROXY?: { fetch: typeof fetch } } | undefined)?.GEMINI_PROXY;
        if (proxy?.fetch) {
          await proxy.fetch("https://proxy.local/health");
        }
      } catch { /* ignore warmup failure */ }
      return Response.json(
        { ok: true, storeVersion: LATEST_STORE_VERSION, storeUrl: PLAY_STORE_URL, majorUpdate: MAJOR_UPDATE_POPUP },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (reqUrl.pathname === "/api/log-client" && request.method === "POST") {
      const text = await request.text().catch(() => "");
      console.warn("[client-log]", text.slice(0, 1000));
      return new Response("ok", { status: 200 });
    }
    if (reqUrl.pathname === "/share-target") {
      const params = new URLSearchParams();
      let mediaDataUrl = "";
      let mediaMime = "image/png";
      const pick = (k: string, v: unknown) => {
        if (typeof v === "string" && v.trim()) {
          const norm = k.startsWith("shared_") ? k : `shared_${k}`;
          if (!params.has(norm)) params.set(norm, v.trim());
        }
      };
      if (request.method === "POST") {
        try {
          const ct = request.headers.get("content-type") ?? "";
          if (ct.includes("application/x-www-form-urlencoded")) {
            const sp = new URLSearchParams(await request.text());
            for (const [k, v] of sp.entries()) pick(k, v);
          } else {
            const form = await request.formData();
            for (const [k, v] of form.entries()) {
              if (typeof v === "string") {
                pick(k, v);
              } else if (v && typeof v === "object" && "arrayBuffer" in v && (v as File).size > 0 && !mediaDataUrl) {
                const file = v as File;
                if (file.size <= 8_000_000) {
                  const buf = new Uint8Array(await file.arrayBuffer());
                  let bin = "";
                  for (let i = 0; i < buf.length; i += 8192) {
                    bin += String.fromCharCode(...buf.subarray(i, i + 8192));
                  }
                  mediaMime = file.type || "image/png";
                  mediaDataUrl = `data:${mediaMime};base64,${btoa(bin)}`;
                  params.set("shared_media", "1");
                }
              }
            }
          }
        } catch (e) {
          console.error("[share-target] POST parse error", e);
        }
      } else {
        for (const [k, v] of reqUrl.searchParams.entries()) pick(k, v);
      }
      const q = params.toString();
      console.log("[share-target]", request.method, q || "(empty)", mediaDataUrl ? `media=${mediaMime}` : "no-media");
      const dest = new URL(q ? `/inbox?${q}` : "/inbox", reqUrl.origin);
      if (mediaDataUrl) {
        const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>(async()=>{try{if("caches" in window){const r=await fetch(${JSON.stringify(mediaDataUrl)});const b=await r.blob();const c=await caches.open("jungbi-share-v1");await c.put("/__shared_media__",new Response(b,{headers:{"Content-Type":${JSON.stringify(mediaMime)}}}));}}catch(e){}location.replace(${JSON.stringify(dest.href)});})();</script></body></html>`;
        return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
      }
      return Response.redirect(dest.toString(), 303);
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
  async scheduled(_controller: unknown, env: unknown, _ctx: unknown) {
    applyEnv(env);
    try {
      await dispatchDueReminders();
    } catch (e) {
      console.error("scheduled reminder dispatch error", e);
    }
    try {
      await runDailyAiHealthCheck();
    } catch (e) {
      console.error("scheduled AI health check error", e);
    }
  },
};
