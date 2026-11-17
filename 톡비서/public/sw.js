// Minimal Service Worker to receive Android Share Target (links, text, and images).
const SHARE_CACHE = "jungbi-share-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleSharePost(event.request));
  }
});

async function handleSharePost(request) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const k of ["shared_title", "shared_text", "shared_url"]) {
    const v = form.get(k);
    if (typeof v === "string" && v.trim()) params.set(k, v.trim());
  }
  const file = form.get("media");
  if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
    const cache = await caches.open(SHARE_CACHE);
    await cache.put("/__shared_media__", new Response(file, { headers: { "Content-Type": file.type || "image/png" } }));
    params.set("shared_media", "1");
  }
  const q = params.toString();
  return Response.redirect(q ? `/inbox?${q}` : "/inbox", 303);
}
