import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLogin, adminLogout, checkAdmin } from "@/lib/admin-auth";
import { getHubOverview } from "@/lib/admin-hub.functions";
import { useStudioTelemetry } from "@/hooks/useStudioTelemetry";
import { Zone1PulseBar } from "@/components/admin/Zone1PulseBar";
import { Zone2Monitor } from "@/components/admin/Zone2Monitor";
import { Zone3ControlCenter } from "@/components/admin/Zone3ControlCenter";
import { AlertDrawer } from "@/components/admin/AlertDrawer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "YJ Studio · 통합 관제 본부" },
      { name: "description", content: "YJ 스튜디오 대표님 전용 3-Zone 모듈식 통합 관제 UI" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "googlebot", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: AdminControlCenter,
});

function AdminControlCenter() {
  const checkFn = useServerFn(checkAdmin);
  const loginFn = useServerFn(adminLogin);
  const logoutFn = useServerFn(adminLogout);
  const overviewFn = useServerFn(getHubOverview);
  const qc = useQueryClient();

  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ["studio-admin-auth"],
    queryFn: () => checkFn(),
  });

  const { data: overview } = useQuery({
    queryKey: ["studio-hub-overview"],
    queryFn: () => overviewFn(),
    enabled: Boolean(auth?.admin),
  });

  const telemetry = useStudioTelemetry(Boolean(auth?.admin));
  const [selectedAppId, setSelectedAppId] = useState<string | "all" | "blog">("all");
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoginBusy(true);
    try {
      const res = await loginFn({ data: { password } });
      if (res.ok) {
        setPassword("");
        await qc.invalidateQueries({ queryKey: ["studio-admin-auth"] });
        toast.success("대표님, 통합 관제 본부에 오신 것을 환영합니다.");
      } else {
        toast.error(res.message || "로그인에 실패했어요.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인 오류");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutFn();
    qc.clear();
    await qc.invalidateQueries({ queryKey: ["studio-admin-auth"] });
    toast("로그아웃했어요.");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        보안 상태를 확인하고 있습니다...
      </div>
    );
  }

  if (!auth?.admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1.5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-800">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">YJ Studio 통합 관제 본부</h1>
            <p className="text-xs text-slate-500">대표님 전용 관리자 비밀번호를 입력해 주세요.</p>
          </div>

          {!auth?.configured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              서버 환경 변수 <code className="rounded bg-amber-100 px-1">ADMIN_PASSWORD</code>가 아직 설정되지 않았습니다.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loginBusy}>
              {loginBusy ? "확인 중..." : "관제 본부 입장"}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/" className="text-xs text-slate-500 underline hover:text-slate-900">
              회사 홈페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allBlocks = overview?.blocks ?? [];
  const blogApps = allBlocks.filter((b) => b.features.blog && b.blogAdapter);
  const tarotConnected = allBlocks.find((b) => b.key === "teacuptarot")?.remoteConnected ?? false;
  const pendingBorderlineCount = telemetry.pluginMetrics.ul_dongne?.borderlineNotices?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Zone 1: 상단 글로벌 펄스 바 (64px 고정) */}
      <Zone1PulseBar
        apps={telemetry.apps}
        selectedAppId={selectedAppId}
        onSelectApp={setSelectedAppId}
        summary={telemetry.summary}
        onOpenAlerts={() => setAlertDrawerOpen(true)}
        onLogout={handleLogout}
      />

      {/* 본문: PC 1440px+ 와이드(좌 65% + 우 35%), 통합 블로그 탭에서는 작업실을 넓게 쓰기 위해 우측 패널을 숨기고 100% 전체 폭 사용 */}
      <main className={`mx-auto flex flex-col gap-6 px-4 py-6 lg:px-6 ${selectedAppId === "blog" ? "w-full max-w-[1700px]" : "max-w-[1600px] lg:flex-row"}`}>
        {/* Zone 2: 모니터링 구역 (통합 블로그 작업실에서는 100% 전체 폭 활용) */}
        <section className={`order-2 min-w-0 flex-1 ${selectedAppId === "blog" ? "w-full" : "lg:order-1 lg:basis-[65%]"}`}>
          <Zone2Monitor
            apps={telemetry.apps}
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
            onToggleMaintenance={telemetry.toggleMaintenance}
            summary={telemetry.summary}
            dailyByDate={telemetry.dailyByDate}
            dailyRows={telemetry.dailyRows}
            pluginMetrics={telemetry.pluginMetrics}
            onNoticeDecision={telemetry.handleNoticeDecision}
            blogApps={blogApps}
            geminiConfigured={Boolean(overview?.geminiConfigured)}
            tarotConnected={tarotConnected}
          />
        </section>

        {/* Zone 3: 우측 35% 액션 & 제어 센터 (통합 블로그 작업실에서는 넓은 작업 환경을 위해 숨김) */}
        {selectedAppId !== "blog" && (
          <section className="order-1 w-full shrink-0 lg:order-2 lg:basis-[35%] lg:max-w-[480px]">
            <Zone3ControlCenter
              apps={telemetry.apps}
              selectedAppId={selectedAppId}
              alerts={telemetry.alerts}
              pendingBorderlineCount={pendingBorderlineCount}
              onUpdateRemoteConfig={telemetry.updateRemoteConfig}
              onResolveAlert={telemetry.resolveAlert}
              onSelectApp={setSelectedAppId}
            />
          </section>
        )}
      </main>

      {/* 우측 긴급 알림 드로어 */}
      <AlertDrawer
        open={alertDrawerOpen}
        onClose={() => setAlertDrawerOpen(false)}
        alerts={telemetry.alerts}
        onResolve={telemetry.resolveAlert}
      />
    </div>
  );
}
