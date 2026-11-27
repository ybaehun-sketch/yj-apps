export type AppStatus = "normal" | "warning" | "critical" | "pre_launch";
export type RevenueGroup = "subscription" | "ad_traffic";

export interface StudioAppEntity {
  id: string;
  key: string;
  name: string;
  category: string;
  revenueGroup: RevenueGroup;
  status: AppStatus;
  yesterdayRevenue: number; // 원
  dau: number;
  aiCost: number; // 원
  aiRevenueRatio: number; // %
  errorCount: number;
  maintenanceMode: boolean;
  noticeBanner: string;
  minVersion: string;
}

export interface TelemetryDailyRow {
  appId: string;
  date: string; // MM-DD
  revenue: number;
  dau: number;
  aiCost: number;
  errorCount: number;
}

export interface SystemAlertRow {
  id: string;
  appId: string;
  appName: string;
  severity: "warning" | "critical";
  title: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface AppPluginMetrics {
  // 울동네
  patrol?: { normal: number; error: number; paused: number };
  borderlineNotices?: Array<{ id: string; title: string; region: string; score: number }>;
  // 톡비서 / 오답정복
  funnel?: Array<{ step: string; count: number }>;
  churnLogs?: Array<{ id: string; reason: string; at: string }>;
  tokenCostPerUser?: number;
  // 러닝크루
  crewTiers?: Array<{ tier: string; count: number }>;
  nearLimitCrews?: Array<{ name: string; current: number; max: number }>;
  dailyCheckinRate?: number;
  // 찻잔타로 / 꿈소반 / AI 대나무숲
  adConversionRate?: number;
  d1Retention?: number;
  d7Retention?: number;
  crossBannerCtr?: number;
}
