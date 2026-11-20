import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://dreamsoban.app";
const STATIC_PATHS = ["/", "/guide"];

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === "Bearer " + key) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const urls = STATIC_PATHS.map((p) => `<url><loc>${BASE_URL}${p}</loc></url>`);
        const pageSize = 1000;
        for (let offset = 0; ; ) {
          const { data, error } = await supabase
            .from("guides").select("slug").eq("published", true)
            .order("slug").range(offset, offset + pageSize - 1);
          if (error) return new Response("Sitemap error", { status: 500, headers: { "Cache-Control": "no-store" } });
          if (!data || data.length === 0) break;
          for (const row of data) urls.push(`<url><loc>${BASE_URL}/guide/${esc(encodeURIComponent(row.slug))}</loc></url>`);
          offset += data.length;
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
