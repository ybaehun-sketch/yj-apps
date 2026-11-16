import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 회원탈퇴: 본인 메모·대화·카테고리·파일을 지우고 계정을 삭제한다.
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 스토리지 파일 (사용자 폴더 기준)
    const { data: files } = await supabaseAdmin.storage.from("shots").list(userId, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
    const { data: rows } = await supabase.from("notes").select("file_path, image_path");
    for (const r of rows ?? []) {
      for (const p of [r.file_path, r.image_path]) if (p && !paths.includes(p)) paths.push(p);
    }
    if (paths.length) await supabaseAdmin.storage.from("shots").remove(paths);

    await supabaseAdmin.from("chat_answers").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_categories").delete().eq("user_id", userId);
    await supabaseAdmin.from("notes").delete().eq("user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("계정을 삭제하지 못했어요");
    return { ok: true };
  });
