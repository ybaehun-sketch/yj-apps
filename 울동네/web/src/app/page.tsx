import Link from 'next/link';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { AppInstallBanner } from '@/components/AppInstallBanner';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { fetchPublishedBlogPosts } from '@/lib/supabase';

const CATEGORIES = [
  '전체',
  '돌봄/아동/청소년',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '농림/축산/어업',
  '생활/문화/법률'
];

const CATEGORY_PILL_STYLES: Record<string, string> = {
  '돌봄/아동/청소년': 'bg-[#fff1e8] text-[#b85418]',
  '어르신/건강': 'bg-[#e8f7f0] text-[#167a4b]',
  '주거/난방비': 'bg-[#eaf3ff] text-[#1967d2]',
  '소상공인/일자리': 'bg-[#f3efff] text-[#653bc4]',
  '농림/축산/어업': 'bg-[#eef6ea] text-[#2e6f24]',
  '생활/문화/법률': 'bg-[#fef7e0] text-[#9c6500]'
};

const PAGE_SIZE = 10;

export const dynamic = 'force-dynamic';

function extractBlogExcerpt(contentMd: string | null, fallback: string): string {
  if (!contentMd) return fallback;
  const plainLines = contentMd
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0);
  const joined = plainLines.slice(0, 3).join(' ');
  if (!joined) return fallback;
  return joined.length > 170 ? `${joined.slice(0, 170)}...` : joined;
}

function buildPageHref(category: string, q: string, page: number): string {
  const sp = new URLSearchParams();
  if (category && category !== '전체') sp.set('category', category);
  if (q) sp.set('q', q);
  if (page > 1) sp.set('page', String(page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : '/';
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || '전체';
  const searchQuery = (params.q || '').trim();
  const currentPage = Math.max(1, Number(params.page || '1') || 1);

  const { posts, totalCount } = await fetchPublishedBlogPosts({
    category: activeCategory,
    q: searchQuery,
    page: currentPage,
    pageSize: PAGE_SIZE
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, idx) => startPage + idx
  );

  return (
    <div>
      <section className="rounded-2xl border border-[#d6e2f7] bg-gradient-to-br from-[#eaf1ff] via-[#f5f8ff] to-[#fcfbf8] p-6 shadow-sm sm:p-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">
          놓치기 쉬운 우리 동네 지원금·생활 혜택
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-[#5f6368]">
          어려운 행정 공고를 누구나 읽기 쉬운 생활 안내문으로 정리해 드립니다.
        </p>

        {/* 돋보기 키워드 검색 */}
        <form action="/" method="GET" className="mt-5 flex items-center gap-2">
          {activeCategory !== '전체' ? (
            <input type="hidden" name="category" value={activeCategory} />
          ) : null}
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="관심 키워드 검색 (예: 난방비, 돌봄, 홍천군, 소상공인)"
              className="w-full rounded-full border border-[#d6deea] bg-white py-2.5 pl-10 pr-4 text-[15px] text-[#202124] shadow-sm outline-none transition focus:border-[#1a73e8]"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1765cc]"
          >
            검색
          </button>
          {searchQuery ? (
            <Link
              href={buildPageHref(activeCategory, '', 1)}
              className="shrink-0 rounded-full border border-[#dadce0] px-3.5 py-2.5 text-sm text-[#5f6368] hover:bg-[#f8f9fa]"
            >
              초기화
            </Link>
          ) : null}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <Link
                key={cat}
                href={buildPageHref(cat, searchQuery, 1)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'border-[#1a73e8] bg-[#1a73e8] text-white'
                    : 'border-[#dadce0] bg-white text-[#5f6368] hover:border-[#1a73e8] hover:text-[#1a73e8]'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </section>

      <AppInstallBanner />
      <AdSenseSlot position="top" />

      {searchQuery ? (
        <p className="mb-3 text-sm text-[#5f6368]">
          <strong className="text-[#202124]">“{searchQuery}”</strong> 검색 결과 {totalCount}건
        </p>
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-10 text-center">
          <p className="text-[17px] font-medium text-[#202124]">
            {searchQuery ? '검색어와 일치하는 매거진 글이 없습니다.' : '아직 발행된 매거진 글이 없습니다.'}
          </p>
          <p className="mt-2 text-sm text-[#5f6368]">
            {searchQuery
              ? '다른 키워드로 다시 검색해 보세요.'
              : '하루 최대 2~3건의 핵심 혜택 초안을 관리자 화면에서 발행하면 이곳에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post, idx) => (
            <div key={post.id} className="contents">
              <article className="rounded-2xl border border-[#dfe3ea] bg-[#fcfbf8] p-6 shadow-sm transition hover:border-[#1a73e8] hover:bg-white hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#5f6368]">
                  <span className="rounded-md bg-[#e8f0fe] px-2.5 py-0.5 font-semibold text-[#1a73e8]">
                    {post.region_sigungu === '전체' ? '전국 공통' : `${post.region_sido} ${post.region_sigungu}`}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 font-semibold ${
                      CATEGORY_PILL_STYLES[post.category] ?? 'bg-[#f1f3f4] text-[#5f6368]'
                    }`}
                  >
                    {post.category}
                  </span>
                  <DeadlineBadge deadlineDate={post.deadline_date} />
                </div>

                <h2 className="mt-2.5 text-xl font-bold leading-snug text-[#202124]">
                  <Link href={`/posts/${post.id}`} className="hover:text-[#1a73e8] hover:underline">
                    {post.blog_title || post.app_title}
                  </Link>
                </h2>

                <p className="mt-2.5 text-[16px] leading-[1.7] text-[#3c4043] line-clamp-3">
                  {extractBlogExcerpt(post.blog_content_md, post.app_summary_3lines)}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#f1f3f4] pt-3 text-xs text-[#5f6368]">
                  <span>출처: {post.org_name}</span>
                </div>
              </article>

              {idx === 4 && idx < posts.length - 1 ? (
                <AdSenseSlot position="middle" />
              ) : null}
            </div>
          ))}
        </div>
      )}

      <AdSenseSlot position="bottom" />

      {/* 페이지 제일 하단 페이지 번호 내비게이션 */}
      {totalCount > 0 ? (
        <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-1.5">
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(activeCategory, searchQuery, currentPage - 1)}
              className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm text-[#5f6368] hover:bg-[#f8f9fa]"
            >
              이전
            </Link>
          ) : null}

          {pageNumbers.map((num) => {
            const isCurrent = num === currentPage;
            return (
              <Link
                key={num}
                href={buildPageHref(activeCategory, searchQuery, num)}
                className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-center text-sm font-medium ${
                  isCurrent
                    ? 'border-[#1a73e8] bg-[#1a73e8] text-white'
                    : 'border-[#dadce0] bg-white text-[#202124] hover:border-[#1a73e8] hover:text-[#1a73e8]'
                }`}
              >
                {num}
              </Link>
            );
          })}

          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(activeCategory, searchQuery, currentPage + 1)}
              className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm text-[#5f6368] hover:bg-[#f8f9fa]"
            >
              다음
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
