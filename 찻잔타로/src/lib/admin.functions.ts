import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { isAdminEmail } from "./access";

function assertAdmin(claims: Record<string, unknown> | undefined) {
  const email = claims?.["email"] as string | undefined;
  if (!isAdminEmail(email)) throw new Error("관리자만 이용할 수 있어요.");
  return email!;
}

export const checkAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ admin: isAdminEmail(context.claims?.email as string | undefined) }));

export const adminLookup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = data.email.toLowerCase();
    let user: { id: string; email?: string; created_at: string } | undefined;
    for (let page = 1; page <= 20 && !user; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error("회원을 조회하지 못했어요.");
      user = list.users.find((u) => u.email?.toLowerCase() === target);
      if (list.users.length < 200) break;
    }
    if (!user) return { found: false as const };
    const [{ data: w }, { data: pays }, { data: adj }] = await Promise.all([
      supabaseAdmin.from("wallets").select("leaves, premium_until").eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("payments").select("payment_id, product_id, amount, status, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("admin_adjustments").select("delta, reason, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    return {
      found: true as const,
      userId: user.id,
      email: user.email ?? target,
      joinedAt: user.created_at,
      leaves: w?.leaves ?? 0,
      premiumUntil: w?.premium_until ?? null,
      payments: pays ?? [],
      adjustments: adj ?? [],
    };
  });

export const adminAdjustLeaves = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      delta: z.number().int().min(-100).max(100).refine((n) => n !== 0),
      reason: z.string().trim().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const adminEmail = assertAdmin(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: w } = await supabaseAdmin.from("wallets").select("leaves").eq("user_id", data.userId).maybeSingle();
    const next = Math.max(0, (w?.leaves ?? 0) + data.delta);
    const { error } = await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: data.userId, leaves: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error("찻잎을 바꾸지 못했어요.");
    await supabaseAdmin.from("admin_adjustments").insert({
      admin_email: adminEmail, user_id: data.userId, delta: data.delta, reason: data.reason,
    });
    return { leaves: next };
  });
