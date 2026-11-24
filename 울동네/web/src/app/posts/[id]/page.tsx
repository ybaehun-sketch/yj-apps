import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppInstallBanner } from '@/components/AppInstallBanner';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { SourceLinkWithInterstitial } from '@/components/SourceLinkWithInterstitial';
import { fetchPublishedPostById } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function splitReadableSentences(text: string): string[] {
  // 마침표/물음표/느낌표 뒤 공백에서 문장을 분리해 어르신도 읽기 편한 호흡으로 줄바꿈
  const parts = text
    .split(/(?<=[다요죠니습까][.!?])\s+|(?<=[!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function renderSimpleMarkdown(md: string) {
  const lines = md.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-3" />;
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={idx} className="my-8 border-[#e8eaed]" />;
    }
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={idx} className="mt-9 mb-3 text-[21px] font-bold leading-snug text-[#202124]">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2
          key={idx}
          className="mt-11 mb-4 border-b border-[#dadce0] pb-2.5 text-[23px] font-bold leading-snug text-[#202124]"
        >
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={idx} className="mt-10 mb-4 text-[24px] font-bold leading-snug text-[#202124]">
          {trimmed.replace(/^#\s+/, '')}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const clean = trimmed.replace(/^[-*]\s+(\[[ xX]\]\s*)?/, '').replace(/\*\*/g, '');
      return (
        <li
          key={idx}
          className="mb-2.5 ml-5 list-disc text-[19px] leading-[1.9] tracking-[0.01em] text-[#202124]"
        >
          {clean}
        </li>
      );
    }
    const clean = trimmed.replace(/\*\*/g, '');
    const sentences = splitReadableSentences(clean);
    return (
      <p
        key={idx}
        className="mb-4 text-[19px] leading-[1.95] tracking-[0.01em] text-[#202124]"
      >
        {sentences.map((sentence, sIdx) => (
          <span key={sIdx} className={sIdx < sentences.length - 1 ? 'mb-2 block' : 'block'}>
            {sentence}
          </span>
        ))}
      </p>
    );
  });
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await fetchPublishedPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-[#dfe3ea] bg-[#fcfbf8] p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <Link href="/" className="text-sm font-medium text-[#1a73e8] hover:underline">
          ← 전체 목록으로 돌아가기
        </Link>
      </div>

      <header className="border-b border-[#dadce0] pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#5f6368]">
          <span className="rounded bg-[#e8f0fe] px-2.5 py-0.5 text-[#1a73e8]">
            {post.region_sigungu === '전체' ? '전국 공통' : `${post.region_sido} ${post.region_sigungu}`}
          </span>
          <span>{post.category}</span>
          <span className="font-semibold">
            <DeadlineBadge deadlineDate={post.deadline_date} prefix="신청 마감:" />
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-snug text-[#202124] sm:text-3xl">
          {post.blog_title || post.app_title}
        </h1>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#5f6368]">
          <span>공식 출처: {post.org_name}</span>
          {post.contact_phone ? <span>문의처: {post.contact_phone}</span> : null}
        </div>
      </header>

      <AppInstallBanner />

      <section className="mt-8 space-y-3">
        {post.blog_content_md
          ? renderSimpleMarkdown(post.blog_content_md)
          : <p className="text-[18px] leading-[1.85] text-[#202124]">{post.app_detail_summary}</p>}
      </section>

      <section className="my-8 rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-6">
        <div className="text-sm font-bold text-[#1a73e8]">마지막으로 확인하는 핵심 요약</div>
        <p className="mt-2.5 whitespace-pre-line text-[19px] leading-[1.9] text-[#202124]">
          {post.app_summary_3lines}
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-[#dadce0] bg-white p-5">
        <div className="text-sm font-bold text-[#202124]">공식 공고 원문 및 신청 확인</div>
        <p className="mt-1 text-sm text-[#5f6368]">
          본 글은 {post.org_name}의 공개 공고를 바탕으로 쉽게 정리한 안내문입니다. 최종 신청과 세부 기준 확인은 공식 페이지에서 진행해 주세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <SourceLinkWithInterstitial sourceUrl={post.source_url} />
          {post.contact_phone ? (
            <a
              href={`tel:${post.contact_phone}`}
              className="inline-flex items-center rounded-lg border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-semibold text-[#202124] hover:bg-[#f8f9fa]"
            >
              문의 전화: {post.contact_phone}
            </a>
          ) : null}
        </div>
      </section>

      <AppInstallBanner />
    </article>
  );
}
