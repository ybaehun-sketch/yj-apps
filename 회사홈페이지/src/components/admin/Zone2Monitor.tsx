import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpDown, Check, RefreshCw, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiKeyMonitorCard } from "@/components/admin/AiKeyMonitorCard";
import { ExternalIntegrationsCard } from "@/components/admin/ExternalIntegrationsCard";
import { UnifiedBlogStudio } from "@/components/admin/UnifiedBlogStudio";
import { TarotMemberBlock } from "@/components/admin/TarotMemberBlock";
import { hubGetGooglePlaySyncStatus, hubSyncGooglePlay } from "@/lib/admin-hub.functions";
import type { StudioAppBlock } from "@/lib/studio-blocks/registry";
import type { AppPluginMetrics, StudioAppEntity, TelemetryDailyRow } from "@/lib/studio-hub/types";

interface Props {
  apps: StudioAppEntity[];
  selectedAppId: string | "all" | "blog";
  onSelectApp: (id: string | "all" | "blog") => void;
  onToggleMaintenance: (id: string) => void;
  summary: {
    totalRevenue: number;
    totalDau: number;
    totalAiCost: number;
    monthlyRevenue: number;
    projectedMonthlyRevenue: number;
    monthlyVisitors: number;
    monthlyAiCost: number;
    projectedMonthlyAiCost: number;
    monthlyNetProfit: number;
    netProfitMargin: number;
    aiCostRatio: number;
  };
  dailyByDate: Array<{
    date: string;
    revenue: number;
    dau: number;
    aiCost: number;
    subscriptionRev: number;
    adTrafficRev: number;
  }>;
  dailyRows: TelemetryDailyRow[];
  pluginMetrics: Record<string, AppPluginMetrics>;
  onNoticeDecision: (noticeId: string) => void;
  blogApps: Array<StudioAppBlock & { remoteConnected: boolean }>;
  geminiConfigured: boolean;
  tarotConnected: boolean;
}

function StatusBadge({ status }: { status: StudioAppEntity["status"] }) {
  if (status === "critical") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        ● 치명적 오류
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        ● 주의
      </span>
    );
  }
  if (status === "pre_launch") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
        ○ 개시전
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      ● 정상
    </span>
  );
}

function MiniSparkline({
  data,
  dataKey,
  color = "#475569",
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  color?: string;
}) {
  return (
    <div className="h-12 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Zone2Monitor({
  apps,
  selectedAppId,
  onSelectApp,
  onToggleMaintenance,
  summary,
  dailyByDate,
  dailyRows,
  pluginMetrics,
  onNoticeDecision,
  blogApps,
  geminiConfigured,
  tarotConnected,
}: Props) {
  const [kpiPeriod, setKpiPeriod] = useState<"daily" | "monthly">("monthly");
  const [sortKey, setSortKey] = useState<"revenue" | "dau" | "aiCost" | "profit" | "error">("revenue");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [pendingToggleApp, setPendingToggleApp] = useState<StudioAppEntity | null>(null);

  const qc = useQueryClient();
  const getPlayStatusFn = useServerFn(hubGetGooglePlaySyncStatus);
  const syncPlayFn = useServerFn(hubSyncGooglePlay);
  const [syncingPlay, setSyncingPlay] = useState(false);

  const { data: playSyncStatus } = useQuery({
    queryKey: ["studio-google-play-sync-status"],
    queryFn: () => getPlayStatusFn(),
    refetchOnWindowFocus: false,
  });

  const handleSyncGooglePlay = async () => {
    setSyncingPlay(true);
    try {
      const res = await syncPlayFn();
      if (res.ok) {
        toast.success(res.message);
        await qc.invalidateQueries({ queryKey: ["studio-live-telemetry"] });
        await qc.invalidateQueries({ queryKey: ["studio-google-play-sync-status"] });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "구글 플레이 동기화 중 오류가 발생했습니다.");
    } finally {
      setSyncingPlay(false);
    }
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedApps = useMemo(() => {
    const list = [...apps];
    list.sort((a, b) => {
      const val = (x: StudioAppEntity) => {
        switch (sortKey) {
          case "revenue":
            return x.yesterdayRevenue;
          case "dau":
            return x.dau;
          case "aiCost":
            return x.aiCost;
          case "profit":
            return x.yesterdayRevenue - x.aiCost;
          case "error":
            return x.errorCount;
        }
      };
      return sortDir === "desc" ? val(b) - val(a) : val(a) - val(b);
    });
    return list;
  }, [apps, sortKey, sortDir]);

  // [통합 블로그] 뷰
  if (selectedAppId === "blog") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">스튜디오 통합 블로그 초안 작업실</h2>
            <p className="mt-1 text-xs text-slate-500">
              울동네 · 찻잔타로 · 꿈소반 · 대나무속풀이의 블로그 초안을 한곳에서 작성, AI 생성, 검수 및 발행합니다.
            </p>
          </div>
          <UnifiedBlogStudio blogApps={blogApps} geminiConfigured={geminiConfigured} />
        </div>
      </div>
    );
  }

  const selectedApp = selectedAppId === "all" ? null : apps.find((a) => a.id === selectedAppId) ?? null;

  // [전체 통합] 뷰
  if (!selectedApp) {
    const isDaily = kpiPeriod === "daily";
    const dailyProfit = summary.totalRevenue - summary.totalAiCost;
    const dailyMargin =
      summary.totalRevenue > 0 ? Number(((dailyProfit / summary.totalRevenue) * 100).toFixed(1)) : 0;

    return (
      <div className="space-y-6">
        {/* 상단: 기준 토글 + 4대 KPI 카드 */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isDaily ? "어제 하루 스튜디오 성적표" : "이번 달 누적 결산"}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncGooglePlay}
                disabled={syncingPlay}
                className="h-7 gap-1.5 bg-white text-[11px]"
                title={
                  playSyncStatus?.configured
                    ? "구글 플레이 관리자에서 이번 달 공식 누적 데이터를 가져옵니다"
                    : "구글 플레이 읽기 열쇠를 등록하면 바로 공식 데이터를 가져올 수 있습니다"
                }
              >
                <RefreshCw className={`h-3 w-3 ${syncingPlay ? "animate-spin" : ""}`} />
                {syncingPlay
                  ? "구글 플레이 가져오는 중..."
                  : playSyncStatus?.configured
                    ? "구글 플레이 동기화"
                    : "구글 플레이 연동 대기"}
              </Button>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setKpiPeriod("daily")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  isDaily ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                어제 기준
              </button>
              <button
                type="button"
                onClick={() => setKpiPeriod("monthly")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  !isDaily ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                이번 달 누적
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {isDaily ? "어제 총매출" : "이번 달 누적 매출"}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {(isDaily ? summary.totalRevenue : summary.monthlyRevenue).toLocaleString()}원
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isDaily
                    ? "전 앱 합산"
                    : `월말 예상 ${summary.projectedMonthlyRevenue.toLocaleString()}원`}
                </p>
              </div>
              <MiniSparkline data={dailyByDate} dataKey="revenue" color="#0f172a" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {isDaily ? "어제 통합 DAU" : "이번 달 누적 방문자"}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {(isDaily ? summary.totalDau : summary.monthlyVisitors).toLocaleString()}명
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isDaily ? `${apps.length}개 서비스 합산` : `일평균 ${summary.totalDau.toLocaleString()}명`}
                </p>
              </div>
              <MiniSparkline data={dailyByDate} dataKey="dau" color="#2563eb" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {isDaily ? "어제 AI 원가" : "이번 달 누적 AI 비용"}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {(isDaily ? summary.totalAiCost : summary.monthlyAiCost).toLocaleString()}원
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isDaily
                    ? `매출 대비 원가율 ${summary.aiCostRatio}%`
                    : `월말 예상 ${summary.projectedMonthlyAiCost.toLocaleString()}원 (${summary.aiCostRatio}%)`}
                </p>
              </div>
              <MiniSparkline data={dailyByDate} dataKey="aiCost" color="#64748b" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {isDaily ? "어제 순수익" : "이번 달 누적 순수익"}
                </p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {(isDaily ? dailyProfit : summary.monthlyNetProfit).toLocaleString()}원
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  AI 비용 제외 이익률 {isDaily ? dailyMargin : summary.netProfitMargin}%
                </p>
              </div>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {isDaily ? "일간 결산" : "월간 결산"}
              </span>
            </div>
          </div>
        </div>

        {/* 중단: 웹 서비스(애드센스) / 모바일 앱(애드몹·구독) 분리 매트릭스 */}
        {(() => {
          const webServices = sortedApps.filter((a) => a.platformType === "web");
          const mobileApps = sortedApps.filter((a) => a.platformType !== "web");

          const renderMatrixCard = (title: string, badge: string, list: StudioAppEntity[]) => (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {badge}
                  </span>
                </div>
                <span className="text-xs text-slate-500">컬럼 제목을 누르면 정렬 · 행을 누르면 상세 이동</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">앱 이름 / 카테고리</th>
                      <th className="px-3 py-3 font-medium">상태</th>
                      <th className="px-3 py-3 text-right font-medium">
                        <button type="button" onClick={() => toggleSort("revenue")} className="inline-flex items-center gap-1 hover:text-slate-900">
                          어제 매출 <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        <button type="button" onClick={() => toggleSort("dau")} className="inline-flex items-center gap-1 hover:text-slate-900">
                          DAU <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        <button type="button" onClick={() => toggleSort("aiCost")} className="inline-flex items-center gap-1 hover:text-slate-900">
                          어제 AI 원가 <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        <button type="button" onClick={() => toggleSort("profit")} className="inline-flex items-center gap-1 hover:text-slate-900">
                          순이익 (원가율) <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        <button type="button" onClick={() => toggleSort("error")} className="inline-flex items-center gap-1 hover:text-slate-900">
                          에러 <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center font-medium">원격 점검</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((app) => {
                      const isPreLaunch = app.status === "pre_launch";
                      const netProfit = app.yesterdayRevenue - app.aiCost;
                      const highCostRatio = app.aiRevenueRatio > 20;
                      return (
                        <tr
                          key={app.id}
                          onClick={() => onSelectApp(app.id)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                            app.status === "critical"
                              ? "bg-red-50/30"
                              : app.status === "warning"
                                ? "bg-amber-50/20"
                                : isPreLaunch
                                  ? "bg-slate-50/40 text-slate-400"
                                  : ""
                          }`}
                        >
                          <td className="px-5 py-3">
                            <div className={`font-medium ${isPreLaunch ? "text-slate-500" : "text-slate-900"}`}>{app.name}</div>
                            <div className="text-xs text-slate-400">{app.category}</div>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-slate-800">
                            {isPreLaunch ? <span className="text-slate-300">-</span> : `${app.yesterdayRevenue.toLocaleString()}원`}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600">
                            {isPreLaunch ? <span className="text-slate-300">-</span> : app.dau.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600">
                            {isPreLaunch ? <span className="text-slate-300">-</span> : app.aiCost > 0 ? `${app.aiCost.toLocaleString()}원` : "-"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {isPreLaunch ? (
                              <span className="text-slate-300">-</span>
                            ) : (
                              <>
                                <div className={`font-medium ${highCostRatio ? "text-amber-600" : "text-slate-800"}`}>
                                  {netProfit.toLocaleString()}원
                                </div>
                                <div className={`text-[11px] ${highCostRatio ? "font-semibold text-amber-600" : "text-slate-400"}`}>
                                  원가율 {app.aiRevenueRatio}%
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {isPreLaunch ? (
                              <span className="text-slate-300">-</span>
                            ) : (
                              <span
                                className={
                                  app.errorCount >= 10
                                    ? "font-bold text-red-600"
                                    : app.errorCount > 0
                                      ? "font-semibold text-amber-600"
                                      : "text-slate-400"
                                }
                              >
                                {app.errorCount}건
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setPendingToggleApp(app)}
                              className={`inline-flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                                app.maintenanceMode ? "bg-red-600" : "bg-slate-200"
                              }`}
                              title="원격 점검 모드 토글"
                            >
                              <span
                                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                  app.maintenanceMode ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );

          return (
            <div className="space-y-4">
              {renderMatrixCard(`웹 서비스 (${webServices.length}개)`, "웹 매거진 · 애드센스", webServices)}
              {renderMatrixCard(`모바일 앱 (${mobileApps.length}개)`, "스토어 앱 · 애드몹 · 구독", mobileApps)}
            </div>
          );
        })()}

        {/* 테이블 원격 점검 2단계 확인 모달 */}
        {pendingToggleApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h3 className="text-base font-bold text-slate-900">원격 점검 모드 확인</h3>
              <p className="mt-2 text-sm text-slate-600">
                정말 <strong className="text-slate-900">[{pendingToggleApp.name}]</strong>의 사용자 접속을{" "}
                {pendingToggleApp.maintenanceMode ? "다시 허용(점검 해제)" : "차단(긴급 점검 켜기)"}하시겠습니까?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPendingToggleApp(null)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  className={pendingToggleApp.maintenanceMode ? "bg-slate-900" : "bg-red-600 hover:bg-red-700"}
                  onClick={() => {
                    onToggleMaintenance(pendingToggleApp.id);
                    setPendingToggleApp(null);
                  }}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI 열쇠 연결 현황 & 예상 잔액 게이지 */}
        <AiKeyMonitorCard />

        {/* 외부 서비스 실시간 연동 현황 (Expo · 클라우드플레어) */}
        <ExternalIntegrationsCard />

        {/* 하단: 수익군별 일별 추이 비교 차트 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">수익군별 7일 매출 추이 비교</h3>
              <p className="text-xs text-slate-500">구독형 3종(톡비서·오답정복·러닝크루) vs 광고·트래픽형 4종</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="subscriptionRev"
                  name="구독형 3종"
                  stroke="#0f172a"
                  fill="#cbd5e1"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="adTrafficRev"
                  name="광고·트래픽형 4종"
                  stroke="#2563eb"
                  fill="#dbeafe"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // [개별 앱] 뷰
  const appDaily = dailyRows.filter((r) => r.appId === selectedApp.id);
  const metrics = pluginMetrics[selectedApp.id] ?? pluginMetrics[selectedApp.id.replace(/_app$/, "")];

  return (
    <div className="space-y-6">
      {/* 상단 공통 KPI */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">{selectedApp.name}</h2>
            <StatusBadge status={selectedApp.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{selectedApp.category}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-slate-500">어제 매출</p>
            <p className="font-bold text-slate-900">{selectedApp.yesterdayRevenue.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">DAU</p>
            <p className="font-bold text-slate-900">{selectedApp.dau.toLocaleString()}명</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">AI 원가</p>
            <p className="font-bold text-slate-900">{selectedApp.aiCost.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">에러 건수</p>
            <p className={`font-bold ${selectedApp.errorCount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {selectedApp.errorCount}건
            </p>
          </div>
        </div>
      </div>

      {/* 7일 매출·DAU 추이 차트 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">{selectedApp.name} 7일 매출 · 방문자 추이</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={appDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" name="매출(원)" stroke="#0f172a" strokeWidth={2} />
              <Line type="monotone" dataKey="dau" name="DAU(명)" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 앱 전용 플러그인 슬롯 */}
      {(selectedApp.id === "ul_dongne" || selectedApp.id === "ul_dongne_app") && metrics && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">순찰대 배치 상태</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-100 p-3">
                  <div className="text-xs text-slate-500">정상</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{metrics.patrol?.normal ?? 0}</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="text-xs text-red-600">오류</div>
                  <div className="mt-1 text-lg font-bold text-red-700">{metrics.patrol?.error ?? 0}</div>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <div className="text-xs text-slate-500">정지</div>
                  <div className="mt-1 text-lg font-bold text-slate-600">{metrics.patrol?.paused ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">65~84점 경계 공고 원클릭 검수</h3>
              <div className="mt-3 space-y-2">
                {(metrics.borderlineNotices ?? []).length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">대기 중인 경계 공고가 없습니다.</p>
                ) : (
                  metrics.borderlineNotices?.map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">[{n.score}점]</span> {n.title}
                        <div className="text-[11px] text-slate-500">{n.region}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onNoticeDecision(n.id)}>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onNoticeDecision(n.id)}>
                          <XIcon className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">블로그 초안 검수 · 발행 (실제 창고 연동)</h3>
            <UnifiedBlogStudio
              blogApps={blogApps.filter((b) => b.key === "uldongne")}
              geminiConfigured={geminiConfigured}
            />
          </div>
        </div>
      )}

      {(selectedApp.id === "talk_secretary" || selectedApp.id === "odap_conquer") && metrics && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">설치 → 무료체험 → 유료결제 퍼널</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.funnel ?? []}>
                  <XAxis dataKey="step" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="사용자 수" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">구독 해지 · 결제 실패 로그</h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                유저당 AI 비용: <strong>{metrics.tokenCostPerUser}원</strong>
              </span>
            </div>
            <div className="space-y-2">
              {metrics.churnLogs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-800">{log.reason}</span>
                  <span className="text-slate-400">{log.at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedApp.id === "running_crew" && metrics && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">티어별 활성 크루 분포</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.crewTiers ?? []}>
                  <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="크루 수" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">정원 상한 임박 크루</h3>
              <span className="text-xs font-medium text-blue-600">일일 인증률 {metrics.dailyCheckinRate}%</span>
            </div>
            {metrics.nearLimitCrews?.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-900">{c.name}</span>
                <span className="font-semibold text-amber-700">
                  {c.current} / {c.max}명
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(selectedApp.id === "teacup_tarot" || selectedApp.id === "kkum_soban" || selectedApp.id === "ai_bamboo") &&
        metrics && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">보상형 광고 전환율</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{metrics.adConversionRate}%</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">D1 리텐션</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{metrics.d1Retention}%</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">D7 리텐션</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{metrics.d7Retention}%</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">크로스 배너 클릭률</div>
                <div className="mt-1 text-xl font-bold text-blue-600">{metrics.crossBannerCtr}%</div>
              </div>
            </div>

            {selectedApp.id === "teacup_tarot" && <TarotMemberBlock connected={tarotConnected} />}

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">{selectedApp.name} 글·가이드 작업실</h3>
              <UnifiedBlogStudio
                blogApps={blogApps.filter((b) => b.key === selectedApp.key)}
                geminiConfigured={geminiConfigured}
              />
            </div>
          </div>
        )}
    </div>
  );
}
