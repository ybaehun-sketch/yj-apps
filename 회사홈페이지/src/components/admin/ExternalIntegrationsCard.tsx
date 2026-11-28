import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Cloud, ExternalLink, RefreshCw, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hubGetExternalIntegrations } from "@/lib/admin-hub.functions";

function formatBuildStatus(status: string | undefined): { label: string; badgeClass: string } {
  switch (status) {
    case "FINISHED":
      return { label: "빌드 성공", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "IN_PROGRESS":
    case "IN_QUEUE":
      return { label: "진행 중", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
    case "ERRORED":
      return { label: "빌드 실패", badgeClass: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { label: status ?? "대기", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

function formatShortDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function ExternalIntegrationsCard() {
  const fetchFn = useServerFn(hubGetExternalIntegrations);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["studio-external-integrations"],
    queryFn: () => fetchFn(),
    refetchOnWindowFocus: false,
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">외부 서비스 실시간 연동 현황</h3>
          <p className="text-xs text-slate-500">
            Expo 앱 빌드 상태와 클라우드플레어 웹 방문자 데이터를 자동으로 불러옵니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 gap-1.5 bg-white text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">외부 서비스 상태를 확인하고 있습니다...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Expo (EAS) 앱 빌드 현황 */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Smartphone className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Expo (EAS) 앱 빌드 현황</div>
                  <div className="text-[11px] text-slate-400">
                    {data?.expo.connected
                      ? `연결 계정: ${data.expo.username ?? "연결됨"}`
                      : "연결 확인 필요"}
                  </div>
                </div>
              </div>
              {data?.expo.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  연결됨
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  미연결
                </span>
              )}
            </div>

            {data?.expo.connected ? (
              data.expo.apps.length > 0 ? (
                <div className="space-y-2">
                  {data.expo.apps.map((app) => {
                    const badge = formatBuildStatus(app.latestBuild?.status);
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{app.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {app.latestBuild
                              ? `v${app.latestBuild.appVersion ?? "-"} · ${app.latestBuild.platform} · ${formatShortDate(app.latestBuild.createdAt)}`
                              : "아직 빌드 기록 없음"}
                          </div>
                        </div>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  등록된 앱이 아직 없습니다.
                </div>
              )
            ) : (
              <div className="rounded-lg bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800">
                {data?.expo.errorMessage ?? "Expo 연결 상태를 확인할 수 없습니다."}
              </div>
            )}
          </div>

          {/* 클라우드플레어 웹 방문자 현황 */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Cloud className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">클라우드플레어 웹 방문자 (최근 2일)</div>
                  <div className="text-[11px] text-slate-400">웹 3형제 · 우리동네 웹 · 회사홈페이지</div>
                </div>
              </div>
              {data?.cloudflare.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  연결됨
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  권한 대기
                </span>
              )}
            </div>

            {data?.cloudflare.connected ? (
              <div className="space-y-1.5">
                {data.cloudflare.sites.map((site) => (
                  <div
                    key={site.domain}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{site.label}</span>
                      <span className="ml-1.5 text-[11px] text-slate-400">{site.domain}</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-600">
                      방문자 <strong className="text-slate-900">{site.uniques.toLocaleString()}명</strong>
                      <span className="mx-1 text-slate-300">|</span>
                      조회 {site.pageViews.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-amber-50/70 p-3 text-xs text-amber-900">
                <p>{data?.cloudflare.errorMessage ?? "클라우드플레어 방문자 통계를 불러오지 못했습니다."}</p>
                {data?.cloudflare.needsAnalyticsPermission && (
                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-700 underline underline-offset-2"
                  >
                    클라우드플레어 열쇠 권한 설정 바로가기
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
