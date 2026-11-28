import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Cloud, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hubGetExternalIntegrations } from "@/lib/admin-hub.functions";

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
            클라우드플레어 웹 방문자 데이터를 자동으로 불러옵니다.
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
        <div>
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
