export interface ExpoBuildItem {
  id: string;
  status: string;
  platform: string;
  appVersion: string | null;
  buildProfile: string | null;
  createdAt: string;
}

export interface ExpoAppItem {
  id: string;
  name: string;
  slug: string;
  accountName: string;
  latestBuild: ExpoBuildItem | null;
}

export interface CloudflareSiteTraffic {
  domain: string;
  label: string;
  uniques: number;
  pageViews: number;
  requests: number;
}

export interface ExternalIntegrationsSnapshot {
  checkedAt: string;
  expo: {
    connected: boolean;
    username: string | null;
    apps: ExpoAppItem[];
    errorMessage: string | null;
  };
  cloudflare: {
    connected: boolean;
    needsAnalyticsPermission: boolean;
    sites: CloudflareSiteTraffic[];
    errorMessage: string | null;
  };
}

const STUDIO_CF_ZONES = [
  { id: "ac9e1bcf75a4e7169c496ecc082b0494", domain: "teacuptarot.com", label: "찻잔타로" },
  { id: "a2ea1511bc3966f1eea6eff2917a8d5d", domain: "dreamsoban.app", label: "꿈소반" },
  { id: "82391a9f4586fb70509c8916f8c5f5de", domain: "bambooforest.app", label: "대나무속풀이" },
  { id: "a3c9548b4e25f0101c8a07e9978a9156", domain: "wooldongne.com", label: "우리동네 웹" },
  { id: "ac8a4e839aefd7822865e5a59cb68b46", domain: "yjstudio.app", label: "회사홈페이지" },
] as const;

async function resolveExpoToken(): Promise<string | null> {
  const envToken = process.env["EXPO_TOKEN"]?.trim();
  if (envToken) return envToken;

  try {
    const fs = await import("node:fs");
    const localPath = "C:\\dev\\yj-apps\\비밀키\\울동네\\expo_token.txt";
    if (fs.existsSync(localPath)) {
      const token = fs.readFileSync(localPath, "utf8").trim();
      if (token) return token;
    }
  } catch {
    // ignore in serverless environments
  }
  return null;
}

async function resolveCloudflareToken(): Promise<string | null> {
  const envToken = process.env["CLOUDFLARE_API_TOKEN"]?.trim();
  if (envToken) return envToken;

  try {
    const fs = await import("node:fs");
    const envFile = "C:\\dev\\yj-apps\\비밀키\\찻잔타로\\.env.local";
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf8");
      for (const line of content.split(/\r?\n/)) {
        if (line.startsWith("CLOUDFLARE_API_TOKEN=")) {
          const val = line.slice("CLOUDFLARE_API_TOKEN=".length).trim().replace(/^['"]|['"]$/g, "");
          if (val) return val;
        }
      }
    }
  } catch {
    // ignore in serverless environments
  }
  return null;
}

async function fetchExpoStatus(): Promise<ExternalIntegrationsSnapshot["expo"]> {
  const token = await resolveExpoToken();
  if (!token) {
    return {
      connected: false,
      username: null,
      apps: [],
      errorMessage: "Expo 연결 열쇠가 아직 등록되지 않았습니다.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const query = `{
      me {
        username
        accounts {
          name
          apps(limit: 10, offset: 0) {
            id
            name
            slug
            builds(limit: 1, offset: 0) {
              id
              status
              platform
              appVersion
              buildProfile
              createdAt
            }
          }
        }
      }
    }`;
    const res = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        connected: false,
        username: null,
        apps: [],
        errorMessage: `Expo 서버 응답 오류 (${res.status})`,
      };
    }
    const json = (await res.json()) as {
      data?: {
        me?: {
          username?: string;
          accounts?: Array<{
            name: string;
            apps?: Array<{
              id: string;
              name: string;
              slug: string;
              builds?: ExpoBuildItem[];
            }>;
          }>;
        };
      };
    };

    const me = json.data?.me;
    const apps: ExpoAppItem[] = [];
    for (const acc of me?.accounts ?? []) {
      for (const app of acc.apps ?? []) {
        if (!app.builds?.length && app.name === acc.name) continue;
        apps.push({
          id: app.id,
          name: app.name,
          slug: app.slug,
          accountName: acc.name,
          latestBuild: app.builds?.[0] ?? null,
        });
      }
    }

    return {
      connected: true,
      username: me?.username ?? null,
      apps,
      errorMessage: null,
    };
  } catch {
    return {
      connected: false,
      username: null,
      apps: [],
      errorMessage: "Expo 서버와 연결 시간이 초과되었습니다.",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCloudflareTraffic(): Promise<ExternalIntegrationsSnapshot["cloudflare"]> {
  const token = await resolveCloudflareToken();
  if (!token) {
    return {
      connected: false,
      needsAnalyticsPermission: false,
      sites: [],
      errorMessage: "클라우드플레어 연결 열쇠가 아직 등록되지 않았습니다.",
    };
  }

  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const since = yesterday.toISOString().slice(0, 10);
  const until = today.toISOString().slice(0, 10);
  const zoneIds = STUDIO_CF_ZONES.map((z) => `"${z.id}"`).join(", ");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const query = `{
      viewer {
        zones(filter: {zoneTag_in: [${zoneIds}]}) {
          zoneTag
          httpRequests1dGroups(limit: 5, filter: {date_geq: "${since}", date_leq: "${until}"}) {
            sum { requests pageViews }
            uniq { uniques }
          }
        }
      }
    }`;

    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        connected: false,
        needsAnalyticsPermission: false,
        sites: [],
        errorMessage: `클라우드플레어 응답 오류 (${res.status})`,
      };
    }

    const json = (await res.json()) as {
      data?: {
        viewer?: {
          zones?: Array<{
            zoneTag: string;
            httpRequests1dGroups?: Array<{
              sum?: { requests?: number; pageViews?: number };
              uniq?: { uniques?: number };
            }>;
          }>;
        };
      };
      errors?: Array<{ message?: string; extensions?: { code?: string } }>;
    };

    if (json.errors?.length) {
      const isAuthz = json.errors.some(
        (e) => e.extensions?.code === "authz" || (e.message ?? "").includes("analytics.read"),
      );
      return {
        connected: false,
        needsAnalyticsPermission: isAuthz,
        sites: [],
        errorMessage: isAuthz
          ? "클라우드플레어 열쇠에 '방문자 통계 읽기(Zone Analytics Read)' 권한이 아직 없습니다."
          : "클라우드플레어 통계를 불러오지 못했습니다.",
      };
    }

    const zoneMap = new Map(
      (json.data?.viewer?.zones ?? []).map((z) => [z.zoneTag, z.httpRequests1dGroups ?? []]),
    );

    const sites: CloudflareSiteTraffic[] = STUDIO_CF_ZONES.map((cfg) => {
      const rows = zoneMap.get(cfg.id) ?? [];
      const uniques = rows.reduce((acc, r) => acc + (r.uniq?.uniques ?? 0), 0);
      const pageViews = rows.reduce((acc, r) => acc + (r.sum?.pageViews ?? 0), 0);
      const requests = rows.reduce((acc, r) => acc + (r.sum?.requests ?? 0), 0);
      return {
        domain: cfg.domain,
        label: cfg.label,
        uniques,
        pageViews,
        requests,
      };
    });

    return {
      connected: true,
      needsAnalyticsPermission: false,
      sites,
      errorMessage: null,
    };
  } catch {
    return {
      connected: false,
      needsAnalyticsPermission: false,
      sites: [],
      errorMessage: "클라우드플레어 연결 시간이 초과되었습니다.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getExternalIntegrationsStatus(): Promise<ExternalIntegrationsSnapshot> {
  const [expo, cloudflare] = await Promise.all([fetchExpoStatus(), fetchCloudflareTraffic()]);
  return {
    checkedAt: new Date().toISOString(),
    expo,
    cloudflare,
  };
}
