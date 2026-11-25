import { DurableObject } from "cloudflare:workers";

interface Env {
  GEMINI_PROXY: DurableObjectNamespace<GeminiProxy>;
}

export class GeminiProxy extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, region: "wnam" });
    }
    const target = new URL(url.pathname + url.search, "https://generativelanguage.googleapis.com");
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");
    return fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.GEMINI_PROXY.idFromName("us-west-1");
    const stub = env.GEMINI_PROXY.get(id, { locationHint: "wnam" });
    return stub.fetch(request);
  },
};
