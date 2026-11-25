import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 회원탈퇴: 본인 메모·대화·카테고리·파일을 지우고 계정을 삭제한다.
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 스토리지 파일 (사용자 폴더 기준)
    const { data: files, error: listErr } = await supabaseAdmin.storage.from("shots").list(userId, { limit: 1000 });
    if (listErr) console.error("[deleteAccount] storage.list error:", listErr.message);
    const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
    const { data: rows } = await supabase.from("notes").select("file_path, image_path");
    for (const r of rows ?? []) {
      for (const p of [r.file_path, r.image_path]) if (p && !paths.includes(p)) paths.push(p);
    }
    if (paths.length) {
      const { error: rmErr } = await supabaseAdmin.storage.from("shots").remove(paths);
      if (rmErr) console.error("[deleteAccount] storage.remove error:", rmErr.message);
    }

    const { error: e1 } = await supabaseAdmin.from("chat_answers").delete().eq("user_id", userId);
    if (e1) console.error("[deleteAccount] chat_answers delete error:", e1.message);
    const { error: e2 } = await supabaseAdmin.from("user_categories").delete().eq("user_id", userId);
    if (e2) console.error("[deleteAccount] user_categories delete error:", e2.message);
    const { error: e3 } = await supabaseAdmin.from("notes").delete().eq("user_id", userId);
    if (e3) console.error("[deleteAccount] notes delete error:", e3.message);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[deleteAccount] auth.admin.deleteUser error:", error.message);
      throw new Error(`계정을 삭제하지 못했어요: ${error.message}`);
    }
    return { ok: true };
  });
