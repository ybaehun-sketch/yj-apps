import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ExternalLink, Megaphone, Power, Send, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudioAppEntity, SystemAlertRow } from "@/lib/studio-hub/types";

interface Props {
  apps: StudioAppEntity[];
  selectedAppId: string | "all" | "blog";
  alerts: SystemAlertRow[];
  pendingBorderlineCount: number;
  onUpdateRemoteConfig: (
    appId: string,
    patch: { maintenanceMode?: boolean; noticeBanner?: string; minVersion?: string },
  ) => void;
  onResolveAlert: (alertId: string) => void;
  onSelectApp: (appId: string | "all" | "blog") => void;
}

export function Zone3ControlCenter({
  apps,
  selectedAppId,
  alerts,
  pendingBorderlineCount,
  onUpdateRemoteConfig,
  onResolveAlert,
  onSelectApp,
}: Props) {
  const [controlAppId, setControlAppId] = useState<string>(apps[0]?.id ?? "ul_dongne");
  const [confirmMaintenanceOpen, setConfirmMaintenanceOpen] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // 상단 탭에서 개별 앱을 선택하면 원격 제어 대상도 해당 앱으로 자동 동기화
  useEffect(() => {
    if (selectedAppId !== "all" && selectedAppId !== "blog") {
      setControlAppId(selectedAppId);
    }
  }, [selectedAppId]);

  const targetApp = apps.find((a) => a.id === controlAppId) ?? apps[0];

  const [bannerText, setBannerText] = useState(targetApp?.noticeBanner ?? "");
  const [minVer, setMinVer] = useState(targetApp?.minVersion ?? "1.0.0");

  useEffect(() => {
    setBannerText(targetApp?.noticeBanner ?? "");
    setMinVer(targetApp?.minVersion ?? "1.0.0");
  }, [targetApp?.id, targetApp?.noticeBanner, targetApp?.minVersion]);

  const activeAlerts = alerts.filter((a) => !a.resolved);

  const handleApply = () => {
    if (!targetApp) return;
    onUpdateRemoteConfig(targetApp.id, {
      noticeBanner: bannerText.trim(),
      minVersion: minVer.trim() || "1.0.0",
    });
    toast.success(`${targetApp.name} 원격 제어 설정을 반영했습니다.`);
  };

  const handleQuickNoticeFromAlert = (al: SystemAlertRow) => {
    setControlAppId(al.appId);
    setBannerText(`[긴급 안내] 현재 ${al.appName} 일부 기능이 지연되어 긴급 점검 중입니다.`);
    toast.info(`${al.appName} 공지 문구를 준비했습니다. 확인 후 [즉시 반영]을 눌러주세요.`);
    setTimeout(() => bannerInputRef.current?.focus(), 50);
  };

  return (
    <aside className="space-y-5">
      {/* 상단 카드: 원격 제어(Remote Config) 퀵 패널 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">원격 제어 퀵 패널</h2>
          </div>
          <select
            aria-label="제어 대상 앱 선택"
            value={targetApp?.id ?? ""}
            onChange={(e) => setControlAppId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
          >
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                대상: {app.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-4">
          {/* 점검 모드 스위치 (2단계 확인 모달 연결) */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${targetApp?.maintenanceMode ? "text-red-600" : "text-slate-400"}`} />
              <div>
                <div className="text-xs font-semibold text-slate-900">긴급 점검 모드</div>
                <div className="text-[11px] text-slate-500">2단계 확인 후 사용자 접속 차단</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmMaintenanceOpen(true)}
              className={`inline-flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                targetApp?.maintenanceMode ? "bg-red-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  targetApp?.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 앱 내 공지 배너 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">앱 내 공지 배너 문구</label>
            <Input
              ref={bannerInputRef}
              placeholder="예: 오늘 밤 12시 서버 점검 예정"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
            />
          </div>

          {/* 최소 강제 업데이트 버전 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">최소 강제 업데이트 버전</label>
            <div className="flex gap-2">
              <Input value={minVer} onChange={(e) => setMinVer(e.target.value)} placeholder="1.0.0" />
              <Button type="button" onClick={handleApply} className="shrink-0 bg-slate-900 hover:bg-slate-800">
                <Send className="mr-1.5 h-3.5 w-3.5" /> 즉시 반영
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 카드: 오늘의 처리 대기함 (원클릭 즉시 조치 연결) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">오늘의 처리 대기함</h2>
          <span className="text-xs font-medium text-slate-500">
            {activeAlerts.length + (pendingBorderlineCount > 0 ? 1 : 0)}건
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {activeAlerts.map((al) => (
            <div
              key={al.id}
              className={`rounded-lg border p-3 text-xs ${
                al.severity === "critical"
                  ? "border-red-200 bg-red-50/70"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <AlertTriangle
                    className={`h-3.5 w-3.5 shrink-0 ${
                      al.severity === "critical" ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                  <span>[{al.appName}] {al.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onResolveAlert(al.id)}
                  className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  완료
                </button>
              </div>
              <p className="mt-1 text-slate-600">{al.message}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectApp(al.appId)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  <ExternalLink className="h-3 w-3" /> 상세 보기
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickNoticeFromAlert(al)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                >
                  <Megaphone className="h-3 w-3" /> 긴급 공지 띄우기
                </button>
              </div>
            </div>
          ))}

          {pendingBorderlineCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectApp("ul_dongne")}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">
                울동네 경계 공고 승인 대기 ({pendingBorderlineCount}건)
              </span>
              <span className="text-blue-600">검수하기 →</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectApp("blog")}
            className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2.5 text-left text-xs hover:bg-blue-50"
          >
            <span className="font-medium text-blue-900">통합 블로그 초안 작성 · 발행</span>
            <span className="text-blue-600">작업실 열기 →</span>
          </button>

          {activeAlerts.length === 0 && pendingBorderlineCount === 0 && (
            <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              오늘 처리할 긴급 항목이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 2단계 긴급 점검 확인 모달 */}
      {confirmMaintenanceOpen && targetApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">긴급 점검 모드 확인</h3>
            <p className="mt-2 text-sm text-slate-600">
              정말 <strong className="text-slate-900">[{targetApp.name}]</strong>의 사용자 접속을{" "}
              {targetApp.maintenanceMode ? "다시 허용(점검 해제)" : "차단(긴급 점검 켜기)"}하시겠습니까?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmMaintenanceOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className={targetApp.maintenanceMode ? "bg-slate-900" : "bg-red-600 hover:bg-red-700"}
                onClick={() => {
                  onUpdateRemoteConfig(targetApp.id, { maintenanceMode: !targetApp.maintenanceMode });
                  toast(
                    `${targetApp.name} 점검 모드를 ${!targetApp.maintenanceMode ? "켰습니다" : "껐습니다"}.`,
                  );
                  setConfirmMaintenanceOpen(false);
                }}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
