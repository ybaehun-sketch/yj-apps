import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { findProduct, SUB_BONUS_LEAVES } from "./products";
import { DAILY_ADS, kstDayStartISO } from "./access";

export type Wallet = { leaves: number; premium: boolean; premiumUntil: string | null };

const toWallet = (w: { leaves: number; premium_until: string | null } | null): Wallet => ({
  leaves: w?.leaves ?? 0,
  premium: !!w?.premium_until && new Date(w.premium_until) > new Date(),
  premiumUntil: w?.premium_until ?? null,
});

export const getWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wallets")
      .select("leaves, premium_until")
      .eq("user_id", context.userId)
      .maybeSingle();
    const w = toWallet(data);
    if (!w.premium) return w;
    // 멤버십: 한국 시각 기준 하루 한 번 찻잎 1개 지급 (지급 기록은 서버 전용 장부에 남김)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("kind", "daily_leaf")
      .gte("created_at", kstDayStartISO());
    if ((count ?? 0) > 0) return w;
    const { error } = await supabaseAdmin.from("usage_events").insert({ user_id: context.userId, kind: "daily_leaf" });
    if (error) return w;
    const leaves = w.leaves + 1;
    await supabaseAdmin.from("wallets").update({ leaves, updated_at: new Date().toISOString() }).eq("user_id", context.userId);
    return { ...w, leaves };
  });

/** 찻잎 1개를 써서 이 상담의 대화 횟수를 서버 장부에 추가 */
export const spendLeafServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ readingId: z.string().uuid() }).parse(d))
  .handler(async ({ data: input, context }) => {
    const { data: reading } = await context.supabase.from("readings").select("id").eq("id", input.readingId).maybeSingle();
    if (!reading) throw new Error("상담을 찾을 수 없어요.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("spend_leaf_for", { _user_id: context.userId, _amount: 1 });
    if (error) throw new Error("찻잎 사용에 실패했어요");
    const ok = (data ?? -1) >= 0;
    if (ok) await supabaseAdmin.from("usage_events").insert({ user_id: context.userId, reading_id: reading.id, kind: "turn_leaf" });
    return { ok, leaves: Math.max(0, data ?? 0) };
  });

/** 광고 시청 보상: 하루 횟수 안에서 이 상담에 대화 1번 추가 */
export const grantAdTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ readingId: z.string().uuid() }).parse(d))
  .handler(async ({ data: input, context }) => {
    const { data: reading } = await context.supabase.from("readings").select("id").eq("id", input.readingId).maybeSingle();
    if (!reading) throw new Error("상담을 찾을 수 없어요.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("kind", "turn_ad")
      .gte("created_at", kstDayStartISO());
    if ((count ?? 0) >= DAILY_ADS) return { ok: false };
    await supabaseAdmin.from("usage_events").insert({ user_id: context.userId, reading_id: reading.id, kind: "turn_ad" });
    return { ok: true };
  });

/** 포트원 결제를 서버에서 조회해 금액·상태를 검증한 뒤 지갑에 적립 */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().min(5).max(100), productId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const product = findProduct(data.productId);
    if (!product) throw new Error("알 수 없는 상품이에요");
    const secret = process.env["PORTONE_API_SECRET"];
    if (!secret) throw new Error("결제 서버 설정이 아직 완료되지 않았어요");

    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(data.paymentId)}`, {
      headers: { Authorization: `PortOne ${secret}` },
    });
    if (!res.ok) {
      console.error("portone lookup failed", res.status, await res.text());
      throw new Error("결제 정보를 확인하지 못했어요");
    }
    const pay = (await res.json()) as { status: string; amount: { total: number }; customData?: string };
    if (pay.status !== "PAID") throw new Error("결제가 완료되지 않았어요");
    if (pay.amount.total !== product.price) throw new Error("결제 금액이 일치하지 않아요");
    let owner: string | undefined;
    try {
      let cd: unknown = pay.customData ?? "{}";
      // PortOne may store customData double-encoded ("{\"uid\":...}") — unwrap until object.
      for (let i = 0; i < 3 && typeof cd === "string"; i++) cd = JSON.parse(cd);
      if (cd && typeof cd === "object") owner = (cd as { uid?: string }).uid;
    } catch { /* ignore */ }
    if (owner !== context.userId) throw new Error("다른 계정의 결제예요");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: dup } = await supabaseAdmin.from("payments").insert({
      payment_id: data.paymentId, user_id: context.userId, product_id: product.id, amount: product.price, status: "PAID",
    });
    const { data: cur } = await supabaseAdmin.from("wallets").select("leaves, premium_until").eq("user_id", context.userId).maybeSingle();
    if (dup) return { wallet: toWallet(cur), already: true }; // 이미 적립된 결제(중복 호출 방지)

    let leaves = cur?.leaves ?? 0;
    let premium_until = cur?.premium_until ?? null;
    if (product.kind === "leaves") leaves += product.leaves ?? 0;
    else {
      leaves += SUB_BONUS_LEAVES;
      const base = premium_until && new Date(premium_until) > new Date() ? new Date(premium_until) : new Date();
      base.setDate(base.getDate() + 30);
      premium_until = base.toISOString();
    }
    await supabaseAdmin.from("wallets").upsert({ user_id: context.userId, leaves, premium_until, updated_at: new Date().toISOString() });
    return { wallet: toWallet({ leaves, premium_until }), already: false };
  });
