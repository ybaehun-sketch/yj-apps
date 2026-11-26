import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { sendUrgentAlert, type AlertSeverity } from "./lib/alerts.server";

function applyEnv(env: unknown) {
  if (env && typeof env === "object") {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string" && !process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

async function handleAlertIngest(request: Request): Promise<Response> {
  const expectedToken = process.env["CONTROL_CENTER_ALERT_TOKEN"]?.trim();
  if (!expectedToken) {
    return Response.json({ ok: false, error: "CONTROL_CENTER_ALERT_TOKEN not configured" }, { status: 503 });
  }
  const providedToken = request.headers.get("x-alert-token")?.trim();
  if (!providedToken || providedToken !== expectedToken) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      appKey?: unknown;
      appName?: unknown;
      title?: unknown;
      message?: unknown;
      severity?: unknown;
    };
    const appKey = typeof body.appKey === "string" ? body.appKey.trim() : "";
    const appName = typeof body.appName === "string" ? body.appName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const severity: AlertSeverity =
      body.severity === "critical" || body.severity === "warning" || body.severity === "info"
        ? body.severity
        : "warning";

    if (!appKey || !appName || !title || !message) {
      return Response.json({ ok: false, error: "Missing required alert fields" }, { status: 400 });
    }

    const result = await sendUrgentAlert({ appKey, appName, title, message, severity });
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}

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

function withAdminNoIndexHeader(request: Request, response: Response): Response {
  const pathname = new URL(request.url).pathname;
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    applyEnv(env);
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/alerts/ingest" && request.method === "POST") {
        return await handleAlertIngest(request);
      }
      const handler = await getServerEntry();
      const response = await normalizeCatastrophicSsrResponse(await handler.fetch(request, env, ctx));
      return withAdminNoIndexHeader(request, response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
