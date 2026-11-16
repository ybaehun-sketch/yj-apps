import { useEffect, useRef, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Note = Tables<"notes">;

/** Play a short two-tone chime via Web Audio API (no external audio file needed). */
export function playAlarmChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.36);
    });
    setTimeout(() => void ctx.close().catch(() => {}), 900);
  } catch {
    // Ignore autoplay restriction errors
  }
}

/** Request browser Notification permission when still undecided. */
export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => {});
  }
}

/** Show a desktop Notification if permission has been granted. */
export function showBrowserNotification(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", ...(tag ? { tag } : {}) });
  } catch {
    // Ignore in environments where Notification constructor is restricted
  }
}

/**
 * Watch saved notes for due `remind_at` timestamps, trigger chime + notification + in-app banner,
 * and notify `onFired` so the note can be marked `reminded = true`.
 */
export function useReminders(
  notes: Note[],
  enabled: boolean,
  onFired: (noteId: string) => Promise<void> | void,
) {
  const [activeAlarms, setActiveAlarms] = useState<Note[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const onFiredRef = useRef(onFired);
  onFiredRef.current = onFired;

  useEffect(() => {
    if (!enabled) return;

    const checkDue = () => {
      const nowMs = Date.now();
      const due = notes.filter(
        (n) =>
          n.confirmed !== false &&
          !n.reminded &&
          !!n.remind_at &&
          !firedRef.current.has(n.id) &&
          Date.parse(n.remind_at) <= nowMs,
      );
      if (!due.length) return;

      for (const n of due) {
        firedRef.current.add(n.id);
        showBrowserNotification("톡비서 알림 ⏰", n.remind_message || n.summary, n.id);
        void onFiredRef.current(n.id);
      }
      playAlarmChime();
      setActiveAlarms((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const next = due.filter((d) => !existing.has(d.id));
        return next.length ? [...next, ...prev] : prev;
      });
    };

    checkDue();
    const timer = window.setInterval(checkDue, 5000);
    return () => window.clearInterval(timer);
  }, [notes, enabled]);

  const dismissAlarm = (id: string) => {
    setActiveAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  return { activeAlarms, dismissAlarm };
}
