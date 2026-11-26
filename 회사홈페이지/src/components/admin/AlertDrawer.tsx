import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { SystemAlertRow } from "@/lib/studio-hub/types";

interface Props {
  open: boolean;
  onClose: () => void;
  alerts: SystemAlertRow[];
  onResolve: (id: string) => void;
}

export function AlertDrawer({ open, onClose, alerts, onResolve }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">긴급 알림 내역</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`rounded-xl border p-3.5 text-sm ${
                al.resolved
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : al.severity === "critical"
                    ? "border-red-200 bg-red-50/70"
                    : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {al.resolved ? (
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  ) : (
                    <AlertTriangle
                      className={`h-4 w-4 ${al.severity === "critical" ? "text-red-600" : "text-amber-600"}`}
                    />
                  )}
                  <span>[{al.appName}] {al.title}</span>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{al.createdAt}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">{al.message}</p>
              {!al.resolved && (
                <div className="mt-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onResolve(al.id)}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    해결 완료 처리
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
