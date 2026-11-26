import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-auth";
import { STUDIO_APP_BLOCKS } from "./studio-blocks/registry";

export const getHubOverview = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const [{ isRemoteConnected }, { getAlertChannelStatus }, { supabaseAdmin }] = await Promise.all([
      import("./studio-blocks/remote-bridge.server"),
      import("./alerts.server"),
      import("@/integrations/supabase/client.server"),
    ]);

    const blocks = STUDIO_APP_BLOCKS.map((b) => ({
      ...b,
      remoteConnected: b.remoteEnvPrefix ? isRemoteConnected(b.key) : false,
    }));

    let recentContacts: Array<{
      id: string;
      name: string;
      email: string;
      message: string;
      created_at: string;
    }> = [];

    try {
      const { data } = await supabaseAdmin
        .from("contact_submissions")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      recentContacts = data ?? [];
    } catch {
      recentContacts = [];
    }

    return {
      blocks,
      alertChannels: getAlertChannelStatus(),
      recentContacts,
      geminiConfigured: Boolean(process.env["GEMINI_API_KEY"]),
      playStoreConfigured: Boolean(process.env["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"]),
    };
  });

export const hubListRemotePosts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ appKey: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { remoteListPosts } = await import("./studio-blocks/remote-bridge.server");
    return remoteListPosts(data.appKey);
  });

export const hubGetBlogFreshness = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ appKeys: z.array(z.string().min(1)) }).parse(d))
  .handler(async ({ data }) => {
    const { remoteGetBlogFreshness } = await import("./studio-blocks/remote-bridge.server");
    return remoteGetBlogFreshness(data.appKeys);
  });

export const hubSaveRemotePost = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        appKey: z.string().min(1),
        id: z.string().optional(),
        slug: z.string().optional(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(300).optional(),
        body: z.string().min(1).max(50000),
        published: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { remoteSavePost } = await import("./studio-blocks/remote-bridge.server");
    return remoteSavePost(data.appKey, data);
  });

export const hubDeleteRemotePost = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ appKey: z.string().min(1), id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { remoteDeletePost } = await import("./studio-blocks/remote-bridge.server");
    return remoteDeletePost(data.appKey, data.id);
  });

export const hubGenerateBlogDraft = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ appKey: z.string().min(1), prompt: z.string().min(1), topic: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      throw new Error("서버에 AI 열쇠(GEMINI_API_KEY)가 아직 설정되지 않았어요.");
    }

    const userPrompt = `${data.prompt}\n\n주제: ${data.topic?.trim() || "오늘 독자들이 가장 궁금해할 만한 실용적인 주제"}\n\n반드시 아래 JSON 형식으로만 답해 주세요:\n{"slug":"english-url-slug","title":"제목","description":"한줄요약(120자 이내)","body":"마크다운 본문"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!res.ok) throw new Error("AI 초안 생성 요청이 실패했어요.");
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("AI 응답이 비어 있어요.");

    const parsed = JSON.parse(raw) as { slug?: string; title?: string; description?: string; body?: string };
    const { recordEstimatedAiSpend } = await import("./ai-key-monitor.server");
    await recordEstimatedAiSpend("studio", 3);
    return {
      slug: (parsed.slug || `draft-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      title: parsed.title || "AI 초안 제목",
      description: parsed.description || "",
      body: parsed.body || "",
    };
  });

export const hubLookupTarotMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data }) => {
    const { remoteLookupTarotMember } = await import("./studio-blocks/remote-bridge.server");
    return remoteLookupTarotMember(data.email);
  });

export const hubAdjustTarotLeaves = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      delta: z.number().int().min(-100).max(100).refine((n) => n !== 0),
      reason: z.string().trim().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { remoteAdjustTarotLeaves } = await import("./studio-blocks/remote-bridge.server");
    return remoteAdjustTarotLeaves(data.userId, data.delta, data.reason);
  });

export const hubSendTestAlert = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      appName: z.string().min(1),
      message: z.string().min(1).max(500),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { sendUrgentAlert } = await import("./alerts.server");
    return sendUrgentAlert(
      {
        appKey: "test",
        appName: data.appName,
        title: "관제센터 긴급 알림 테스트",
        message: data.message,
        severity: "warning",
      },
      { bypassCooldown: true },
    );
  });

export const hubListUldongneTargets = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const { remoteListUldongneTargets } = await import("./studio-blocks/remote-bridge.server");
    return remoteListUldongneTargets();
  });

export const hubGetAiKeyMonitor = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const { checkAllAiKeys } = await import("./ai-key-monitor.server");
    return checkAllAiKeys();
  });

export const hubTestAiKeyDeep = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ groupId: z.enum(["service", "patrol", "studio"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const { runDeepAiKeyTest } = await import("./ai-key-monitor.server");
    return runDeepAiKeyTest(data.groupId);
  });

export const hubUpdateAiBudget = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        groupId: z.enum(["service", "patrol", "studio"]),
        monthlyBudgetKrw: z.number().min(0).max(100000000),
        estimatedSpentKrw: z.number().min(0).max(100000000),
        alertThresholdPercent: z.number().min(5).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const { updateAiKeyBudget } = await import("./ai-key-monitor.server");
    return updateAiKeyBudget(data.groupId, {
      monthlyBudgetKrw: data.monthlyBudgetKrw,
      estimatedSpentKrw: data.estimatedSpentKrw,
      alertThresholdPercent: data.alertThresholdPercent,
    });
  });
