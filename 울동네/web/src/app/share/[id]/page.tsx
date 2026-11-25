import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { SourceLinkWithInterstitial } from '@/components/SourceLinkWithInterstitial';
import { fetchPublishedPostById } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPublishedPostById(id);
  if (!post) {
    return { title: '울동네 - 우리 동네 복지 혜택 알림' };
  }

  const summary = post.app_summary_3lines.replace(/\r?\n/g, ' · ').slice(0, 110);
  return {
    title: `${post.app_title} | 울동네`,
    description: summary,
    openGraph: {
      title: post.app_title,
      description: `우리 동네 복지 혜택 알림 · ${summary}`,
      type: 'article'
    }
  };
}

export default async function SharedCardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await fetchPublishedPostById(id);

  if (!post) {
    notFound();
  }

  const appDownloadUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://yjstudio.app';
  const summaryLines = post.app_summary_3lines
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-xl space-y-5 py-2">
      {/* 공유받은 카드 핵심 내용 */}
      <article className="rounded-2xl border border-[#dfe3ea] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-md bg-[#e8f0fe] px-2.5 py-1 text-[#1a73e8]">
            {post.region_code === '00000' ? '전국 공통' : `${post.region_sido} ${post.region_sigungu}`}
          </span>
          <span className="rounded-md bg-[#fff1e8] px-2.5 py-1 text-[#b85418]">
            {post.category}
          </span>
          <span className="ml-auto">
            <DeadlineBadge deadlineDate={post.deadline_date} prefix="마감:" />
          </span>
        </div>

        <h1 className="mt-4 text-xl font-bold leading-snug text-[#202124] sm:text-2xl">
          {post.app_title}
        </h1>

        <div className="mt-5 space-y-2.5 rounded-xl border border-[#cfe0fc] bg-[#eef4ff] p-4">
          <div className="text-xs font-bold text-[#1a73e8]">핵심 요약</div>
          {summaryLines.map((line, idx) => (
            <p key={idx} className="text-[15px] leading-relaxed text-[#202124]">
              {line}
            </p>
          ))}
        </div>

        {post.app_detail_summary ? (
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[#3c4043]">
            {post.app_detail_summary}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f3f4] pt-4">
          <span className="text-xs text-[#5f6368]">공식 출처: {post.org_name}</span>
          <div className="flex flex-wrap gap-2">
            <SourceLinkWithInterstitial sourceUrl={post.source_url} />
            {post.publish_to_blog ? (
              <Link
                href={`/posts/${post.id}`}
                className="inline-flex items-center rounded-lg border border-[#dadce0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#202124] hover:bg-[#f8f9fa]"
              >
                상세 가이드 보기
              </Link>
            ) : null}
          </div>
        </div>
      </article>

      {/* 하단 울동네 앱 다운로드 배너 */}
      <section className="rounded-2xl border border-[#cfe0fc] bg-[#eef4ff] p-6 shadow-sm">
        <div className="text-base font-extrabold text-[#1a73e8]">
          우리 동네 복지 혜택 알림
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-[#3c4043]">
          회원가입 없이 10초 만에 내 동네 지원금·혜택을 받아보세요.
        </p>
        <a
          href={appDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#1a73e8] px-5 py-3.5 text-base font-bold text-white transition hover:bg-[#1557b0]"
        >
          울동네 앱 다운로드 받기 →
        </a>
      </section>

      <p className="text-center text-xs text-[#5f6368]">
        본 서비스는 정부·지자체 공식 앱이 아닌 민간 생활정보 큐레이션 서비스입니다.
      </p>
    </div>
  );
}
