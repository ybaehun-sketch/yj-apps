import { ingestAppTelemetry } from "./telemetry.server";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface GooglePlaySyncStatus {
  configured: boolean;
  hasServiceAccount: boolean;
  hasBucket: boolean;
  bucketMasked: string | null;
  lastSyncedAt: string | null;
  lastSummary: string | null;
}

export interface GooglePlaySyncResult {
  ok: boolean;
  message: string;
  syncedApps: Array<{
    appId: string;
    appName: string;
    packageName: string;
    activeDevices: number;
    monthlyInstalls: number;
    monthlyRevenueKrw: number;
    latestDate: string | null;
  }>;
}

const LAUNCHED_PLAY_APPS = [
  { appId: "talk_secretary", appName: "톡비서", packageName: "app.yjstudio.tokbiseo" },
  { appId: "odap_conquer", appName: "오답정복", packageName: "app.yjstudio.wrongnote" },
] as const;

let lastSyncMeta: { syncedAt: string | null; summary: string | null } = {
  syncedAt: null,
  summary: null,
};

function normalizeBucketName(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^gs:\/\//i, "").replace(/\/+$/, "");
  return cleaned || null;
}

async function resolveBucketName(): Promise<string | null> {
  const fromEnv = normalizeBucketName(process.env["GOOGLE_PLAY_BUCKET_NAME"]);
  if (fromEnv) return fromEnv;

  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const candidates = [
      path.resolve(process.cwd(), ".env.local"),
      "C:\\dev\\yj-apps\\비밀키\\회사홈페이지\\google-play.env",
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, "utf8");
        const m = content.match(/^GOOGLE_PLAY_BUCKET_NAME\s*=\s*(.+)$/m);
        if (m?.[1]) {
          const parsed = normalizeBucketName(m[1].replace(/^["']|["']$/g, ""));
          if (parsed) return parsed;
        }
      }
    }
  } catch {
    // ignore in serverless environments
  }

  return null;
}

async function resolveServiceAccount(): Promise<ServiceAccountKey | null> {
  const rawEnv = process.env["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"]?.trim();
  if (rawEnv) {
    try {
      const parsed = JSON.parse(rawEnv) as Partial<ServiceAccountKey>;
      if (parsed.client_email && parsed.private_key) {
        return parsed as ServiceAccountKey;
      }
    } catch {
      // ignore
    }
  }

  // 로컬 비밀키 보관함 경로 자동 탐색
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const candidates = [
      path.resolve(process.cwd(), ".google-play-reader.local.json"),
      "C:\\dev\\yj-apps\\비밀키\\회사홈페이지\\google-play-reader.json",
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<ServiceAccountKey>;
        if (parsed.client_email && parsed.private_key) {
          return parsed as ServiceAccountKey;
        }
      }
    }
  } catch {
    // 서버리스 환경 등에서는 무시
  }

  return null;
}

export async function getGooglePlaySyncStatus(): Promise<GooglePlaySyncStatus> {
  const sa = await resolveServiceAccount();
  const bucket = await resolveBucketName();
  return {
    configured: Boolean(sa && bucket),
    hasServiceAccount: Boolean(sa),
    hasBucket: Boolean(bucket),
    bucketMasked: bucket ? `${bucket.slice(0, 12)}...${bucket.slice(-4)}` : null,
    lastSyncedAt: lastSyncMeta.syncedAt,
    lastSummary: lastSyncMeta.summary,
  };
}

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

async function fetchGoogleAccessToken(sa: ServiceAccountKey): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/devstorage.read_only",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );

  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(sigBuffer))}`;

  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`구글 인증 토큰 발급 실패 (${res.status})`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("구글 인증 응답에 토큰이 없습니다.");
  }
  return json.access_token;
}

function decodePlayCsv(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Google Play CSV는 종종 UTF-16LE BOM(0xFF 0xFE)으로 인코딩됨
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
}

function parseCsvRows(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cols = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    return row;
  });
}

async function fetchBucketObject(
  bucket: string,
  objectPath: string,
  accessToken: string,
): Promise<ArrayBuffer | null> {
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectPath)}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`보고서 다운로드 실패 (${objectPath}, 코드 ${res.status})`);
  }
  return res.arrayBuffer();
}

export async function syncGooglePlayMetrics(): Promise<GooglePlaySyncResult> {
  const sa = await resolveServiceAccount();
  const bucket = await resolveBucketName();

  if (!sa || !bucket) {
    return {
      ok: false,
      message: "구글 플레이 읽기 열쇠 또는 보관함 주소(Bucket)가 아직 등록되지 않았습니다.",
      syncedApps: [],
    };
  }

  const accessToken = await fetchGoogleAccessToken(sa);
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyyMm = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}`;

  // 1) 이번 달 매출 보고서 (선택적: 유료 결제가 없으면 404일 수 있음)
  const revenueByPkg = new Map<string, number>();
  const salesBuf = await fetchBucketObject(bucket, `sales/salesreport_${yyyyMm}.csv`, accessToken);
  if (salesBuf) {
    const rows = parseCsvRows(decodePlayCsv(salesBuf));
    for (const r of rows) {
      const pkg = r["Product ID"] || r["Package Name"] || "";
      const amount = Number((r["Charged Amount"] || "0").replace(/,/g, "")) || 0;
      const currency = (r["Currency of Sale"] || "KRW").toUpperCase();
      if (!pkg || amount <= 0) continue;
      const krw = currency === "KRW" ? amount : currency === "USD" ? amount * 1400 : amount;
      revenueByPkg.set(pkg, (revenueByPkg.get(pkg) ?? 0) + Math.round(krw));
    }
  }

  // 2) 앱별 이번 달 설치/활성 기기 보고서
  const syncedApps: GooglePlaySyncResult["syncedApps"] = [];

  for (const app of LAUNCHED_PLAY_APPS) {
    const objectPath = `stats/installs/installs_${app.packageName}_${yyyyMm}_overview.csv`;
    const buf = await fetchBucketObject(bucket, objectPath, accessToken);
    let activeDevices = 0;
    let monthlyInstalls = 0;
    let latestDate: string | null = null;

    if (buf) {
      const rows = parseCsvRows(decodePlayCsv(buf));
      for (const r of rows) {
        const d = r["Date"] || "";
        const active = Number((r["Active Device Installs"] || "0").replace(/,/g, "")) || 0;
        const dailyInstall =
          Number((r["Daily User Installs"] || r["Daily Device Installs"] || "0").replace(/,/g, "")) || 0;
        monthlyInstalls += dailyInstall;
        if (d) latestDate = d;
        if (active > 0) activeDevices = active;
      }
    }

    const monthlyRevenueKrw = revenueByPkg.get(app.packageName) ?? 0;

    if (buf || monthlyRevenueKrw > 0) {
      await ingestAppTelemetry({
        appId: app.appId,
        date: latestDate ?? undefined,
        dau: activeDevices,
        revenue: monthlyRevenueKrw,
      });
    }

    syncedApps.push({
      appId: app.appId,
      appName: app.appName,
      packageName: app.packageName,
      activeDevices,
      monthlyInstalls,
      monthlyRevenueKrw,
      latestDate,
    });
  }

  const nowIso = new Date().toISOString();
  const summaryText = syncedApps
    .map((a) => `${a.appName}(활성 ${a.activeDevices.toLocaleString()}대, 누적설치 ${a.monthlyInstalls.toLocaleString()})`)
    .join(" · ");
  lastSyncMeta = { syncedAt: nowIso, summary: summaryText };

  return {
    ok: true,
    message: "구글 플레이 관리자 이번 달 공식 누적 데이터를 동기화했습니다.",
    syncedApps,
  };
}
