import { createFileRoute } from "@tanstack/react-router";
import { listGuides } from "@/lib/guides.functions";

const BASE = "https://teacuptarot.com";
const STATIC = ["/", "/about", "/guide", "/contact", "/terms", "/privacy"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const guides = await listGuides().catch(() => []);
        const today = new Date().toISOString().slice(0, 10);
        const urls = [
          ...STATIC.map((p) => `<url><loc>${BASE}${p}</loc><lastmod>${today}</lastmod></url>`),
          ...guides.map((g) => `<url><loc>${BASE}/guide/${g.slug}</loc><lastmod>${g.created_at.slice(0, 10)}</lastmod></url>`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
