import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudioAppEntity } from "@/lib/studio-hub/types";

interface Props {
  apps: StudioAppEntity[];
  selectedAppId: string | "all" | "blog";
  onSelectApp: (id: string | "all" | "blog") => void;
  summary: {
    totalRevenue: number;
    totalDau: number;
    aiCostRatio: number;
    overallStatus: "normal" | "warning" | "critical";
    criticalCount: number;
  };
  onOpenAlerts: () => void;
  onLogout: () => void;
}

interface GroupItem extends StudioAppEntity {
  displayName?: string;
  displaySub?: string;
}

function GroupDropdown({
  label,
  apps,
  selectedAppId,
  isGroupActive,
  onSelectApp,
}: {
  label: string;
  apps: GroupItem[];
  selectedAppId: string | "all" | "blog";
  isGroupActive: boolean;
  onSelectApp: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selectedInGroup = isGroupActive ? apps.find((a) => a.id === selectedAppId) : null;
  const hasCritical = apps.some((a) => a.status === "critical");
  const hasWarning = apps.some((a) => a.status === "warning");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          selectedInGroup
            ? "bg-blue-600 !text-white font-semibold"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <span className={selectedInGroup ? "!text-white font-semibold" : ""}>
          {selectedInGroup ? `${selectedInGroup.displayName ?? selectedInGroup.name}` : `${label} (${apps.length})`}
        </span>
        {(hasCritical || hasWarning) && (
          <span
            className={`h-2 w-2 rounded-full ${hasCritical ? "bg-red-500" : "bg-amber-500"}`}
          />
        )}
        <ChevronDown className={`h-3.5 w-3.5 ${selectedInGroup ? "text-white" : "opacity-70"}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {apps.map((app) => {
            const active = isGroupActive && app.id === selectedAppId;
            return (
              <button
                key={`${app.id}-${app.displayName ?? app.name}`}
                type="button"
                onClick={() => {
                  onSelectApp(app.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="font-medium text-slate-900">{app.displayName ?? app.name}</div>
                  <div className="text-[10px] text-slate-400">{app.displaySub ?? app.category}</div>
                </div>
                {app.status !== "normal" && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      app.status === "critical" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Zone1PulseBar({
  apps,
  selectedAppId,
  onSelectApp,
  summary,
  onOpenAlerts,
  onLogout,
}: Props) {
  const statusLabel =
    summary.overallStatus === "critical"
      ? "긴급 점검"
      : summary.overallStatus === "warning"
        ? "주의 필요"
        : "정상 가동";

  const statusBadgeClass =
    summary.overallStatus === "critical"
      ? "bg-red-500/15 text-red-600 border-red-500/30"
      : summary.overallStatus === "warning"
        ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
        : "bg-slate-100 text-slate-600 border-slate-200";

  const [activeGroup, setActiveGroup] = useState<"web" | "app" | null>(null);

  useEffect(() => {
    if (selectedAppId === "all" || selectedAppId === "blog") {
      setActiveGroup(null);
    } else if (activeGroup === null) {
      if (
        ["teacuptarot", "dreamsoban", "bambooforest"].includes(selectedAppId) ||
        ["teacup_tarot", "kkum_soban", "ai_bamboo"].includes(selectedAppId)
      ) {
        setActiveGroup("web");
      } else if (
        ["tokbiseo", "wrongnote", "running"].includes(selectedAppId) ||
        ["talk_secretary", "odap_conquer", "running_crew"].includes(selectedAppId)
      ) {
        setActiveGroup("app");
      }
    }
  }, [selectedAppId]);

  // 웹 서비스 그룹: 웹 전용 3종 + 우리동네 웹매거진
  const webApps: GroupItem[] = [
    ...apps
      .filter(
        (a) =>
          a.platformType === "web" ||
          ["teacuptarot", "dreamsoban", "bambooforest"].includes(a.key) ||
          ["teacup_tarot", "kkum_soban", "ai_bamboo"].includes(a.id)
      )
      .map((a) => ({ ...a, displayName: a.name, displaySub: a.category })),
    ...apps
      .filter((a) => a.key === "uldongne" || a.id === "ul_dongne")
      .map((a) => ({
        ...a,
        displayName: "우리동네 웹매거진",
        displaySub: "복지·혜택 큐레이션 웹 (wooldongne.com)",
      })),
  ];

  // 핸드폰 앱 그룹: 모바일 앱 3종 + 우리동네 앱 (스토어)
  const mobileApps: GroupItem[] = [
    ...apps
      .filter(
        (a) =>
          a.platformType === "app" ||
          ["tokbiseo", "wrongnote", "running"].includes(a.key) ||
          ["talk_secretary", "odap_conquer", "running_crew"].includes(a.id)
      )
      .map((a) => ({ ...a, displayName: a.name, displaySub: a.category })),
    ...apps
      .filter((a) => a.key === "uldongne" || a.id === "ul_dongne")
      .map((a) => ({
        ...a,
        displayName: "우리동네 앱",
        displaySub: "구글 플레이스토어 앱 (v1.0.1)",
      })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2 lg:flex-nowrap lg:px-6">
        {/* 좌측: 로고 + 4대 핵심 지표 배지 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900">YJ Studio</span>
          </div>

          <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-3 xl:flex">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              전일 매출 <strong>{summary.totalRevenue.toLocaleString()}원</strong>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              DAU <strong>{summary.totalDau.toLocaleString()}</strong>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              AI 원가율 <strong>{summary.aiCostRatio}%</strong>
            </span>
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusBadgeClass}`}>
              ● {statusLabel}
            </span>
          </div>
        </div>

        {/* 중앙: 고정 탭 2개 + 형태별 그룹 드롭다운 (웹 서비스 vs 핸드폰 앱) */}
        <nav className="order-3 flex w-full items-center gap-1.5 lg:order-2 lg:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveGroup(null);
              onSelectApp("all");
            }}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedAppId === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체 통합
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveGroup(null);
              onSelectApp("blog");
            }}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedAppId === "blog"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            ✍️ 통합 블로그
          </button>

          <GroupDropdown
            label="🌐 웹 서비스"
            apps={webApps}
            selectedAppId={selectedAppId}
            isGroupActive={activeGroup === "web"}
            onSelectApp={(id) => {
              setActiveGroup("web");
              onSelectApp(id);
            }}
          />
          <GroupDropdown
            label="📱 핸드폰 앱"
            apps={mobileApps}
            selectedAppId={selectedAppId}
            isGroupActive={activeGroup === "app"}
            onSelectApp={(id) => {
              setActiveGroup("app");
              onSelectApp(id);
            }}
          />
        </nav>

        {/* 우측: 긴급 알림 드로어 버튼 + 로그아웃 */}
        <div className="order-2 flex items-center gap-2 lg:order-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAlerts}
            className="relative border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            <span className="text-xs font-medium">긴급 알림</span>
            {summary.criticalCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {summary.criticalCount}
              </span>
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onLogout} title="로그아웃">
            <LogOut className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>
    </header>
  );
}
