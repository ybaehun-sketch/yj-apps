import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

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
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string" && v !== "") {
        process.env[k] = v;
      }
    }
  }
}

async function handleAiHealthCheck(): Promise<Response> {
  const key = (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"])?.trim();
  if (!key) {
    return Response.json({ ok: false, reason: "missing_key" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const res = await fetch(
      `https://tokbiseo-gemini-proxy.ybaehun.workers.dev/v1beta/models?pageSize=1&key=${encodeURIComponent(key)}`,
      { method: "GET" },
    );
    if (!res.ok) {
      return Response.json({ ok: false, reason: "gemini_error", status: res.status }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ ok: true, hasKey: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, reason: "network_error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    applyEnv(env);
    if (new URL(request.url).pathname === "/api/health/ai") {
      return await handleAiHealthCheck();
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
};
