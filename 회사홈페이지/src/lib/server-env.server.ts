// 로컬 개발(vite dev) 시 .env.local의 서버 전용 환경변수를 process.env로 안전하게 불러오는 헬퍼
let loaded = false;

export async function ensureLocalEnvLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  if (typeof process === "undefined" || typeof process.cwd !== "function") return;
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = (m[2] ?? "").replace(/^['"]|['"]$/g, "");
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // Cloudflare Worker 등 파일시스템이 없는 환경에서는 무시
  }
}
