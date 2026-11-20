import { createFileRoute } from "@tanstack/react-router";

// 칼럼 사진은 비공개 저장소에 있고, 파일 이름 형식이 맞을 때만 이 주소로 내보내요.
export const Route = createFileRoute("/api/public/story-image/$name")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(params.name)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("story-images").download(params.name);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: { "Content-Type": data.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
