import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STUDIO_APP_BLOCKS, type BlogAdapterKind, type StudioAppBlock } from "./registry";

export interface UnifiedPostItem {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  body: string;
  published: boolean;
  updatedAt?: string;
  extraMeta?: string;
}

function getBlock(appKey: string): StudioAppBlock {
  const block = STUDIO_APP_BLOCKS.find((b) => b.key === appKey);
  if (!block) throw new Error(`등록되지 않은 앱 블록입니다: ${appKey}`);
  return block;
}

function createRemoteSupabase(prefix?: string): SupabaseClient | null {
  if (!prefix) return null;
  const url = process.env[`REMOTE_${prefix}_URL`];
  const key = process.env[`REMOTE_${prefix}_SERVICE_KEY`];
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export function isRemoteConnected(appKey: string): boolean {
  const block = getBlock(appKey);
  if (!block.remoteEnvPrefix) return false;
  return Boolean(
    process.env[`REMOTE_${block.remoteEnvPrefix}_URL`] &&
      process.env[`REMOTE_${block.remoteEnvPrefix}_SERVICE_KEY`],
  );
}

function getTableName(adapter: BlogAdapterKind): string {
  switch (adapter) {
    case "guides":
      return "guides";
    case "dream_guides":
      return "dream_guides";
    case "bamboo_stories":
      return "bamboo_stories";
    case "welfare_posts":
      return "uldongne_welfare_posts";
  }
}

export async function remoteListPosts(appKey: string): Promise<{
  connected: boolean;
  items: UnifiedPostItem[];
  patrolSummary?: { total: number; errorCount: number };
}> {
  const block = getBlock(appKey);
  const client = createRemoteSupabase(block.remoteEnvPrefix);
  if (!client || !block.blogAdapter) {
    return { connected: false, items: [] };
  }

  const table = getTableName(block.blogAdapter);

  if (block.blogAdapter === "welfare_posts") {
    const [{ data: posts, error }, { data: targets }] = await Promise.all([
      client
        .from("uldongne_welfare_posts")
        .select("id, region_sido, region_sigungu, org_name, app_title, blog_title, blog_content_md, blog_status, created_at")
        .in("blog_status", ["draft", "published"])
        .order("created_at", { ascending: false })
        .limit(40),
      client.from("uldongne_crawl_targets").select("id, status"),
    ]);

    if (error) throw new Error(`울동네 데이터를 불러오지 못했어요: ${error.message}`);

    const items: UnifiedPostItem[] = (posts ?? []).map((p) => ({
      id: String(p.id),
      title: String(p.blog_title || p.app_title || "제목 없음"),
      description: `${p.region_sido ?? ""} ${p.region_sigungu ?? ""} · ${p.org_name ?? ""}`.trim(),
      body: String(p.blog_content_md || ""),
      published: p.blog_status === "published",
      updatedAt: String(p.created_at ?? ""),
      extraMeta: p.blog_status === "draft" ? "초안 대기중" : "발행 완료",
    }));

    const targetList = targets ?? [];
    return {
      connected: true,
      items,
      patrolSummary: {
        total: targetList.length,
        errorCount: targetList.filter((t) => t.status === "error").length,
      },
    };
  }

  const { data, error } = await client
    .from(table)
    .select("id, slug, title, description, body, published, updated_at, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw new Error(`${block.name} 글 목록을 불러오지 못했어요: ${error.message}`);

  return {
    connected: true,
    items: (data ?? []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug ?? ""),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      body: String(row.body ?? ""),
      published: Boolean(row.published),
      updatedAt: String(row.updated_at || row.created_at || ""),
    })),
  };
}

export interface BlogFreshnessInfo {
  connected: boolean;
  lastPublishedAt: string | null;
}

export async function remoteGetBlogFreshness(
  appKeys: string[],
): Promise<Record<string, BlogFreshnessInfo>> {
  const result: Record<string, BlogFreshnessInfo> = {};

  await Promise.all(
    appKeys.map(async (appKey) => {
      try {
        const block = getBlock(appKey);
        const client = createRemoteSupabase(block.remoteEnvPrefix);
        if (!client || !block.blogAdapter) {
          result[appKey] = { connected: false, lastPublishedAt: null };
          return;
        }

        if (block.blogAdapter === "welfare_posts") {
          const { data } = await client
            .from("uldongne_welfare_posts")
            .select("blog_published_at, created_at")
            .eq("blog_status", "published")
            .order("blog_published_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          result[appKey] = {
            connected: true,
            lastPublishedAt: data ? String(data.blog_published_at || data.created_at || "") || null : null,
          };
          return;
        }

        const table = getTableName(block.blogAdapter);
        const { data } = await client
          .from(table)
          .select("updated_at, created_at")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        result[appKey] = {
          connected: true,
          lastPublishedAt: data ? String(data.created_at || data.updated_at || "") || null : null,
        };
      } catch {
        result[appKey] = { connected: false, lastPublishedAt: null };
      }
    }),
  );

  return result;
}

export async function remoteSavePost(
  appKey: string,
  input: {
    id?: string | undefined;
    slug?: string | undefined;
    title: string;
    description?: string | undefined;
    body: string;
    published: boolean;
  },
): Promise<{ ok: true }> {
  const block = getBlock(appKey);
  const client = createRemoteSupabase(block.remoteEnvPrefix);
  if (!client || !block.blogAdapter) {
    throw new Error(`${block.name} 연결 열쇠가 아직 서버에 설정되지 않았어요.`);
  }

  if (block.blogAdapter === "welfare_posts") {
    if (!input.id) {
      throw new Error("울동네는 수집된 복지 초안을 선택해 수정·발행할 수 있어요.");
    }
    const { error } = await client
      .from("uldongne_welfare_posts")
      .update({
        blog_title: input.title,
        blog_content_md: input.body,
        blog_status: input.published ? "published" : "draft",
        publish_to_blog: input.published,
        ...(input.published ? { blog_published_at: new Date().toISOString() } : {}),
      })
      .eq("id", input.id);

    if (error) throw new Error(`울동네 저장 실패: ${error.message}`);
    return { ok: true };
  }

  const table = getTableName(block.blogAdapter);
  const payload = {
    slug: (input.slug || `post-${Date.now()}`).trim().toLowerCase(),
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    body: input.body,
    published: input.published,
    updated_at: new Date().toISOString(),
  };

  const { error } = input.id
    ? await client.from(table).update(payload).eq("id", input.id)
    : await client.from(table).insert(payload);

  if (error) throw new Error(`${block.name} 저장 실패: ${error.message}`);
  return { ok: true };
}

export async function remoteDeletePost(appKey: string, id: string): Promise<{ ok: true }> {
  const block = getBlock(appKey);
  const client = createRemoteSupabase(block.remoteEnvPrefix);
  if (!client || !block.blogAdapter) {
    throw new Error(`${block.name} 연결 열쇠가 설정되지 않았어요.`);
  }

  if (block.blogAdapter === "welfare_posts") {
    const { error } = await client
      .from("uldongne_welfare_posts")
      .update({ blog_status: "rejected", publish_to_blog: false })
      .eq("id", id);
    if (error) throw new Error(`울동네 초안 숨김 실패: ${error.message}`);
    return { ok: true };
  }

  const table = getTableName(block.blogAdapter);
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw new Error(`${block.name} 글 삭제 실패: ${error.message}`);
  return { ok: true };
}

export async function remoteLookupTarotMember(email: string) {
  const client = createRemoteSupabase("TEACUPTAROT");
  if (!client) return { connected: false as const, found: false as const };

  const target = email.trim().toLowerCase();
  let foundUser: { id: string; email?: string; created_at: string } | undefined;
  for (let page = 1; page <= 10 && !foundUser; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("찻잔타로 회원 목록을 조회하지 못했어요.");
    foundUser = data.users.find((u) => u.email?.toLowerCase() === target);
    if (data.users.length < 200) break;
  }

  if (!foundUser) return { connected: true as const, found: false as const };

  const { data: wallet } = await client
    .from("wallets")
    .select("leaves, premium_until")
    .eq("user_id", foundUser.id)
    .maybeSingle();

  return {
    connected: true as const,
    found: true as const,
    userId: foundUser.id,
    email: foundUser.email ?? target,
    joinedAt: foundUser.created_at,
    leaves: wallet?.leaves ?? 0,
    premiumUntil: wallet?.premium_until ?? null,
  };
}

export async function remoteAdjustTarotLeaves(userId: string, delta: number, reason: string) {
  const client = createRemoteSupabase("TEACUPTAROT");
  if (!client) throw new Error("찻잔타로 연결 열쇠가 아직 설정되지 않았어요.");

  const { data: w } = await client.from("wallets").select("leaves").eq("user_id", userId).maybeSingle();
  const next = Math.max(0, (w?.leaves ?? 0) + delta);
  const { error } = await client
    .from("wallets")
    .upsert({ user_id: userId, leaves: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error("찻잎 수량을 변경하지 못했어요.");

  await client.from("admin_adjustments").insert({
    admin_email: "studio-hub@yjstudio.app",
    user_id: userId,
    delta,
    reason,
  });

  return { leaves: next };
}

export interface UldongneCrawlTarget {
  id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  source_type: string;
  target_url: string;
  status: "active" | "error" | "paused";
  fail_count: number;
  last_item_title: string | null;
  last_checked_at: string | null;
}

export async function remoteListUldongneTargets(): Promise<UldongneCrawlTarget[]> {
  const client = createRemoteSupabase("ULDONGNE");
  if (!client) return [];

  const { data, error } = await client
    .from("uldongne_crawl_targets")
    .select("id, region_sido, region_sigungu, region_code, org_name, source_type, target_url, status, fail_count, last_item_title, last_checked_at")
    .order("status", { ascending: true })
    .order("region_code", { ascending: true })
    .order("org_name", { ascending: true });

  if (error) throw new Error(`울동네 순찰 목록을 불러오지 못했어요: ${error.message}`);
  return (data ?? []) as UldongneCrawlTarget[];
}

export interface UldongnePatrolBriefingTargetItem {
  org_name: string;
  region_sido: string;
  region_sigungu: string;
  target_url: string;
  reason?: string;
}

export interface UldongnePatrolBriefing {
  id: string;
  patrol_date: string;
  slot: "slot_1" | "slot_2" | "slot_3";
  patrol_type: "main" | "reserve";
  round_started_at: string;
  checked_count: number;
  success_count: number;
  created_posts: number;
  problem_targets: UldongnePatrolBriefingTargetItem[];
  recovered_targets: UldongnePatrolBriefingTargetItem[];
  failed_targets: UldongnePatrolBriefingTargetItem[];
  updated_at: string;
}

export async function remoteListUldongneBriefings(limit = 60): Promise<UldongnePatrolBriefing[]> {
  const client = createRemoteSupabase("ULDONGNE");
  if (!client) return [];

  const { data, error } = await client
    .from("uldongne_patrol_briefings")
    .select("*")
    .order("patrol_date", { ascending: false })
    .order("slot", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`울동네 순찰 브리핑을 불러오지 못했어요: ${error.message}`);
  return (data ?? []) as UldongnePatrolBriefing[];
}
