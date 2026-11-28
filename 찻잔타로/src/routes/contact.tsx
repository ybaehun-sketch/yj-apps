import { createFileRoute, Link } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/business";
import { useI18n } from "@/lib/i18n";

const T = "문의하기 — 찻잔 타로";
const D = "찻잔 타로 운영팀(와이제이 스튜디오) 연락처 및 이용 문의 안내입니다.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t("contactTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("contactIntro")}</p>
      </div>

      <section className="space-y-4 rounded-3xl border bg-card p-6 text-sm leading-relaxed shadow-warm">
        <h2 className="font-serif text-lg font-bold">{t("contactSection")}</h2>
        <dl className="space-y-2.5 text-muted-foreground">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">{t("contactOperator")}</dt>
            <dd>{t("footerStudioName")}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">{t("contactEmail")}</dt>
            <dd>
              <a href={`mailto:${BUSINESS.email}`} className="font-medium text-primary underline underline-offset-4">
                {BUSINESS.email}
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">{t("contactSite")}</dt>
            <dd>https://teacuptarot.com</dd>
          </div>
        </dl>
        <p className="pt-2 text-xs text-muted-foreground">{t("contactReply")}</p>
      </section>
    </main>
  );
}
