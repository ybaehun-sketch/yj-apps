import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { generateChatCompletion } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { isAdminEmail } from "./access";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listStories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("stories").select("slug, title, description, created_at")
    .eq("published", true).order("created_at", { ascending: false }).limit(500);
  if (error) console.error("listStories", error.message);
  return data ?? [];
});

export const getStory = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: s } = await publicClient()
      .from("stories").select("slug, title, description, body, created_at")
      .eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!s) throw notFound();
    return s;
  });

const emailOf = (claims: unknown) =>
  (claims as Record<string, unknown> | undefined)?.["email"] as string | undefined;
function assertAdmin(claims: unknown) {
  if (!isAdminEmail(emailOf(claims))) throw new Error("관리자만 이용할 수 있어요.");
}

export const checkAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ admin: isAdminEmail(emailOf(context.claims)) }));

export const adminListStories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("stories").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const storyInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(300),
  body: z.string().min(1).max(50000),
  published: z.boolean(),
});

export const adminSaveStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => storyInput.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { slug: data.slug, title: data.title, description: data.description, body: data.body, published: data.published, updated_at: new Date().toISOString() };
    const { error } = data.id
      ? await supabaseAdmin.from("stories").update(row).eq("id", data.id)
      : await supabaseAdmin.from("stories").insert(row);
    if (error) throw new Error(error.code === "23505" ? "같은 주소의 글이 이미 있어요." : "저장하지 못했어요.");
    return { ok: true };
  });

export const adminDeleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("stories").delete().eq("id", data.id);
    return { ok: true };
  });

/** AI가 기존 글과 겹치지 않게 초안을 채운다. 저장하지 않는다. */
export const adminDraftStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ prompt: z.string().trim().min(1).max(8000), topic: z.string().trim().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("stories").select("title, slug").order("created_at", { ascending: false }).limit(150);
    const existing = (rows ?? []).map((r) => `- ${r.title} (${r.slug})`).join("\n") || "(아직 없음)";
    const instructions = `${data.prompt}

[이미 올린 글 — 겹치거나 비슷한 주제는 쓰지 마세요]
${existing}

[출력 규칙]
JSON 객체 하나만 출력. 키: title(한국어 제목), slug(영어 소문자·숫자·하이픈, 60자 이내, 위와 다른 값), description(검색용 한 줄 요약 120자 안팎), body(마크다운: ## 소제목, - 목록, **굵게**, 빈 줄 문단. # 제목은 넣지 않음).`;
    let text = "";
    try {
      const { openaiJson } = await import("./openai.server");
      text = await openaiJson(instructions, `${data.topic ? `오늘의 주제 힌트: ${data.topic}` : "아직 다루지 않은, 검색이 많을 만한 새 주제를 골라 써 주세요."}\n(지정된 JSON 형식으로만 답해 주세요.)`);
    } catch (e) {
      console.error("draft error", e instanceof Error ? e.message : "unknown");
      throw new Error("AI가 초안을 쓰지 못했어요. 잠시 후 다시 눌러 주세요.");
    }
    let p: Record<string, unknown>;
    try { p = JSON.parse(text); } catch { throw new Error("AI 답을 읽지 못했어요. 다시 눌러 주세요."); }
    const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string).trim() : "");
    return {
      title: s("title"),
      slug: s("slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120),
      description: s("description").slice(0, 300),
      body: s("body"),
    };
  });

const imageInput = z.object({
  base64: z.string().min(1).max(7_500_000),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

/** 관리자가 고른 사진을 비공개 저장소에 올리고 글에 넣을 주소를 돌려준다. */
export const adminUploadStoryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.type.split("/")[1] === "jpeg" ? "jpg" : data.type.split("/")[1];
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage.from("story-images").upload(name, bytes, { contentType: data.type });
    if (error) throw new Error("사진을 올리지 못했어요.");
    return { url: `/api/public/story-image/${name}` };
  });
