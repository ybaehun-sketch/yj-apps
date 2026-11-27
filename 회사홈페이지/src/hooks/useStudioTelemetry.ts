import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { hubGetLiveTelemetry, hubGetRecentAlerts, hubResolveAlert } from "@/lib/admin-hub.functions";
import {
  MOCK_APPS,
  MOCK_PLUGIN_METRICS,
  MOCK_SYSTEM_ALERTS,
  MOCK_TELEMETRY_DAILY,
} from "@/lib/studio-hub/mock-data";
import type { StudioAppEntity, SystemAlertRow } from "@/lib/studio-hub/types";

/**
 * 스튜디오 관제 데이터 훅
 * 실제 수신된 긴급 알림(/api/alerts/ingest)을 서버에서 실시간 조회해 상단 배지·서랍에 합산하며,
 * 앱 지표는 목업/원격 상태를 조합해 반환합니다.
 */
export function useStudioTelemetry(enabled = true) {
  const getLiveAlertsFn = useServerFn(hubGetRecentAlerts);
  const resolveLiveAlertFn = useServerFn(hubResolveAlert);
  const getLiveTelemetryFn = useServerFn(hubGetLiveTelemetry);
  const qc = useQueryClient();

  const [baseApps, setBaseApps] = useState<StudioAppEntity[]>(MOCK_APPS);
  const [mockAlerts, setMockAlerts] = useState<SystemAlertRow[]>(MOCK_SYSTEM_ALERTS);
  const [borderlineNotices, setBorderlineNotices] = useState(
    MOCK_PLUGIN_METRICS["ul_dongne"]?.borderlineNotices ?? [],
  );

  const { data: liveTelemetry } = useQuery({
    queryKey: ["studio-live-telemetry"],
    queryFn: () => getLiveTelemetryFn(),
    enabled,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const apps = useMemo<StudioAppEntity[]>(() => {
    const latest = liveTelemetry?.latestByApp ?? {};
    return baseApps.map((app) => {
      const live = latest[app.id];
      if (!live) return app;
      const aiRevenueRatio =
        live.yesterdayRevenue > 0
          ? Number(((live.aiCost / live.yesterdayRevenue) * 100).toFixed(1))
          : 0;
      return {
        ...app,
        status: live.status,
        yesterdayRevenue: live.yesterdayRevenue,
        dau: live.dau,
        aiCost: live.aiCost,
        aiRevenueRatio,
        errorCount: live.errorCount,
      };
    });
  }, [baseApps, liveTelemetry]);

  const dailyRows = useMemo(() => {
    const liveRows = liveTelemetry?.dailyRows ?? [];
    if (liveRows.length === 0) return MOCK_TELEMETRY_DAILY;
    const liveKeySet = new Set(liveRows.map((r) => `${r.appId}::${r.date}`));
    const merged = [
      ...MOCK_TELEMETRY_DAILY.filter((r) => !liveKeySet.has(`${r.appId}::${r.date}`)),
      ...liveRows,
    ];
    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }, [liveTelemetry]);

  const { data: liveAlertRows = [] } = useQuery({
    queryKey: ["studio-live-alerts"],
    queryFn: () => getLiveAlertsFn(),
    enabled,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const alerts = useMemo<SystemAlertRow[]>(() => {
    const mappedLive: SystemAlertRow[] = liveAlertRows.map((al) => {
      const date = new Date(al.receivedAt);
      const formattedTime = Number.isNaN(date.getTime())
        ? al.receivedAt
        : date.toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
      return {
        id: al.id,
        appId: al.appKey,
        appName: al.appName,
        severity: al.severity === "critical" ? "critical" : "warning",
        title: al.title,
        message: al.message,
        createdAt: formattedTime,
        resolved: al.resolved,
      };
    });
    return [...mappedLive, ...mockAlerts];
  }, [liveAlertRows, mockAlerts]);

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

    for (const row of dailyRows) {
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
  }, [apps, dailyRows]);

  const toggleMaintenance = (appId: string) => {
    setBaseApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, maintenanceMode: !a.maintenanceMode } : a)),
    );
  };

  const updateRemoteConfig = (
    appId: string,
    patch: { maintenanceMode?: boolean; noticeBanner?: string; minVersion?: string },
  ) => {
    setBaseApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, ...patch } : a)),
    );
  };

  const resolveAlert = async (alertId: string) => {
    if (alertId.startsWith("live_")) {
      try {
        await resolveLiveAlertFn({ data: { id: alertId } });
        await qc.invalidateQueries({ queryKey: ["studio-live-alerts"] });
      } catch {
        // 무시하고 다음 주기에 재시도
      }
      return;
    }
    setMockAlerts((prev) => prev.map((al) => (al.id === alertId ? { ...al, resolved: true } : al)));
  };

  const handleNoticeDecision = (noticeId: string) => {
    setBorderlineNotices((prev) => prev.filter((n) => n.id !== noticeId));
  };

  return {
    apps,
    alerts,
    summary,
    dailyByDate,
    dailyRows,
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
