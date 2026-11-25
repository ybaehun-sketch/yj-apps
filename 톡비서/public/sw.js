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
  const payload = {};
  for (const k of ["shared_title", "shared_text", "shared_url"]) {
    const v = form.get(k);
    if (typeof v === "string" && v.trim()) {
      params.set(k, v.trim());
      payload[k] = v.trim();
    }
  }
  const cache = await caches.open(SHARE_CACHE);
  if (Object.keys(payload).length > 0) {
    await cache.put(
      "/__shared_payload__",
      new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } }),
    );
  }
  const file = form.get("media");
  if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
    await cache.put("/__shared_media__", new Response(file, { headers: { "Content-Type": file.type || "image/png" } }));
    params.set("shared_media", "1");
  }
  const q = params.toString();
  const dest = new URL(q ? `/inbox?${q}` : "/inbox", request.url);
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${dest.href.replace(/"/g, "&quot;")}"><script>location.replace(${JSON.stringify(dest.href)});</script></head><body></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }
  const title = data.title || "톡비서 알림";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "tokbiseo-reminder",
    data: { url: data.url || "/inbox" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return client.navigate(targetUrl);
          return client;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
