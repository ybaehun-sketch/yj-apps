import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 회원 탈퇴: 상담 기록·찻잎 지갑·계정을 삭제. 결제 기록(payments)은 전자상거래법상 보존 의무로 남긴다.
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    for (const t of ["reading_messages", "readings", "wallets"] as const) {
      const r = await supabaseAdmin.from(t).delete().eq("user_id", uid);
      if (r.error) throw new Error("탈퇴 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("탈퇴 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    return { ok: true };
  });
