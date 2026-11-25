import { supabase } from "@/integrations/supabase/client";
import type { PushSubscriptionData } from "./web-push.server";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function serializeSub(sub: PushSubscription): PushSubscriptionData | null {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh, auth } };
}

async function saveSubscriptions(mutate: (cur: PushSubscriptionData[]) => PushSubscriptionData[], enabled: boolean) {
  const { data } = await supabase.auth.getUser();
  const meta = (data.user?.user_metadata ?? {}) as { push_subscriptions?: PushSubscriptionData[] };
  const current = Array.isArray(meta.push_subscriptions) ? meta.push_subscriptions : [];
  const next = mutate(current).slice(0, 5);
  await supabase.auth.updateUser({
    data: { push_enabled: enabled, push_subscriptions: next },
  });
}

export async function enablePushNotifications(): Promise<"ok" | "denied" | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return "denied";

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return "ok";

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const serialized = serializeSub(sub);
    if (serialized) {
      await saveSubscriptions(
        (cur) => [serialized, ...cur.filter((x) => x.endpoint !== serialized.endpoint)],
        true,
      );
    }
  } catch (e) {
    console.error("Push subscribe failed", e);
  }
  return "ok";
}

export async function disablePushNotifications(): Promise<void> {
  let removedEndpoint: string | null = null;
  if (isPushSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        removedEndpoint = sub.endpoint;
        await sub.unsubscribe();
      }
    } catch {
      // ignore
    }
  }
  try {
    await saveSubscriptions(
      (cur) => (removedEndpoint ? cur.filter((x) => x.endpoint !== removedEndpoint) : cur),
      false,
    );
  } catch {
    // ignore
  }
}

export async function syncPushIfEnabled(enabled: boolean): Promise<void> {
  if (!enabled || !isPushSupported() || Notification.permission !== "granted") return;
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const serialized = serializeSub(sub);
    if (!serialized) return;
    const { data } = await supabase.auth.getUser();
    const meta = (data.user?.user_metadata ?? {}) as { push_subscriptions?: PushSubscriptionData[]; push_enabled?: boolean };
    const existing = Array.isArray(meta.push_subscriptions) ? meta.push_subscriptions : [];
    const already = meta.push_enabled === true && existing.some((x) => x.endpoint === serialized.endpoint);
    if (!already) {
      await saveSubscriptions(
        (cur) => [serialized, ...cur.filter((x) => x.endpoint !== serialized.endpoint)],
        true,
      );
    }
  } catch {
    // ignore silent sync failure
  }
}
