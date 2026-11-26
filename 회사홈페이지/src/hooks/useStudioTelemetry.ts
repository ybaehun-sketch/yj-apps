import { useMemo, useState } from "react";
import {
  MOCK_APPS,
  MOCK_PLUGIN_METRICS,
  MOCK_SYSTEM_ALERTS,
  MOCK_TELEMETRY_DAILY,
} from "@/lib/studio-hub/mock-data";
import type { StudioAppEntity, SystemAlertRow } from "@/lib/studio-hub/types";

/**
 * 스튜디오 관제 데이터 훅
 * 현재는 초기 화면 검증을 위해 현실적인 목업 데이터를 반환하며,
 * 추후 Supabase(`apps`, `telemetry_daily`, `system_alerts`) 테이블 생성 시
 * 이 훅 내부의 초기값/조회 함수만 교체하면 전체 UI가 즉시 실데이터로 바인딩됩니다.
 */
export function useStudioTelemetry() {
  const [apps, setApps] = useState<StudioAppEntity[]>(MOCK_APPS);
  const [alerts, setAlerts] = useState<SystemAlertRow[]>(MOCK_SYSTEM_ALERTS);
  const [borderlineNotices, setBorderlineNotices] = useState(
    MOCK_PLUGIN_METRICS["ul_dongne"]?.borderlineNotices ?? [],
  );

  const summary = useMemo(() => {
    const totalRevenue = apps.reduce((s, a) => s + a.yesterdayRevenue, 0);
    const totalDau = apps.reduce((s, a) => s + a.dau, 0);
    const totalAiCost = apps.reduce((s, a) => s + a.aiCost, 0);
    const dayOfMonth = Math.max(1, new Date().getDate());
    const monthlyRevenue = totalRevenue * dayOfMonth;
    const projectedMonthlyRevenue = totalRevenue * 30;
    const monthlyVisitors = totalDau * dayOfMonth;
    const monthlyAiCost = totalAiCost * dayOfMonth;
    const projectedMonthlyAiCost = totalAiCost * 30;
    const monthlyNetProfit = monthlyRevenue - monthlyAiCost;
    const netProfitMargin =
      monthlyRevenue > 0 ? Number(((monthlyNetProfit / monthlyRevenue) * 100).toFixed(1)) : 0;
    const aiCostRatio = totalRevenue > 0 ? Number(((totalAiCost / totalRevenue) * 100).toFixed(1)) : 0;
    const criticalCount = alerts.filter((a) => !a.resolved && a.severity === "critical").length;
    const warningCount = alerts.filter((a) => !a.resolved && a.severity === "warning").length;
    const overallStatus =
      criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "normal";

    return {
      totalRevenue,
      totalDau,
      totalAiCost,
      monthlyRevenue,
      projectedMonthlyRevenue,
      monthlyVisitors,
      monthlyAiCost,
      projectedMonthlyAiCost,
      monthlyNetProfit,
      netProfitMargin,
      aiCostRatio,
      criticalCount,
      warningCount,
      overallStatus: overallStatus as "normal" | "warning" | "critical",
    };
  }, [apps, alerts]);

  const dailyByDate = useMemo(() => {
    const map = new Map<
      string,
      { date: string; revenue: number; dau: number; aiCost: number; subscriptionRev: number; adTrafficRev: number }
    >();
    const groupMap = new Map(apps.map((a) => [a.id, a.revenueGroup]));

    for (const row of MOCK_TELEMETRY_DAILY) {
      const cur = map.get(row.date) ?? {
        date: row.date,
        revenue: 0,
        dau: 0,
        aiCost: 0,
        subscriptionRev: 0,
        adTrafficRev: 0,
      };
      cur.revenue += row.revenue;
      cur.dau += row.dau;
      cur.aiCost += row.aiCost;
      if (groupMap.get(row.appId) === "subscription") cur.subscriptionRev += row.revenue;
      else cur.adTrafficRev += row.revenue;
      map.set(row.date, cur);
    }
    return [...map.values()];
  }, [apps]);

  const toggleMaintenance = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, maintenanceMode: !a.maintenanceMode } : a)),
    );
  };

  const updateRemoteConfig = (
    appId: string,
    patch: { maintenanceMode?: boolean; noticeBanner?: string; minVersion?: string },
  ) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, ...patch } : a)),
    );
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((al) => (al.id === alertId ? { ...al, resolved: true } : al)));
  };

  const handleNoticeDecision = (noticeId: string) => {
    setBorderlineNotices((prev) => prev.filter((n) => n.id !== noticeId));
  };

  return {
    apps,
    alerts,
    summary,
    dailyByDate,
    dailyRows: MOCK_TELEMETRY_DAILY,
    pluginMetrics: {
      ...MOCK_PLUGIN_METRICS,
      ul_dongne: {
        ...MOCK_PLUGIN_METRICS["ul_dongne"],
        borderlineNotices,
      },
    },
    toggleMaintenance,
    updateRemoteConfig,
    resolveAlert,
    handleNoticeDecision,
  };
}
