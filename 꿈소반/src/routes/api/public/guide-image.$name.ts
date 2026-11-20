import { createFileRoute } from "@tanstack/react-router";

// 글 사진은 비공개 저장소에 있고, 파일 이름 형식이 맞을 때만 이 주소로 내보내요(사진 외 데이터는 없음).
export const Route = createFileRoute("/api/public/guide-image/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(params.name)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("guide-images").download(params.name);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: { "Content-Type": data.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
