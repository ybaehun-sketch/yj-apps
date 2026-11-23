import Link from 'next/link';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { AppInstallBanner } from '@/components/AppInstallBanner';
import { fetchPublishedBlogPosts } from '@/lib/supabase';

const CATEGORIES = [
  '전체',
  '돌봄/육아',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '생활/문화'
];

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || '전체';
  const posts = await fetchPublishedBlogPosts(activeCategory);

  return (
    <div>
      <section className="border-b border-[#dadce0] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">
          놓치기 쉬운 우리 동네 지원금·생활 혜택
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-[#5f6368]">
          어려운 행정 공고를 누구나 읽기 쉬운 생활 안내문으로 정리해 드립니다.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            const href = cat === '전체' ? '/' : `/?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
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

      {posts.length === 0 ? (
        <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-10 text-center">
          <p className="text-[17px] font-medium text-[#202124]">
            아직 발행된 매거진 글이 없습니다.
          </p>
          <p className="mt-2 text-sm text-[#5f6368]">
            자동 순찰기가 수집한 공고를 관리자 화면에서 발행하면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#dadce0] border-t border-b border-[#dadce0]">
          {posts.map((post) => (
            <article key={post.id} className="py-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#5f6368]">
                <span className="rounded bg-[#e8f0fe] px-2.5 py-0.5 text-[#1a73e8]">
                  {post.region_sigungu === '전체' ? '전국 공통' : `${post.region_sido} ${post.region_sigungu}`}
                </span>
                <span>{post.category}</span>
                {post.deadline_date ? (
                  <span className="text-[#d93025]">마감 {post.deadline_date}</span>
                ) : null}
              </div>

              <h2 className="mt-2 text-xl font-bold text-[#202124]">
                <Link href={`/posts/${post.id}`} className="hover:text-[#1a73e8] hover:underline">
                  {post.blog_title || post.app_title}
                </Link>
              </h2>

              <p className="mt-2 whitespace-pre-line text-[17px] leading-[1.75] text-[#3c4043]">
                {post.app_summary_3lines}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-[#5f6368]">
                <span>출처: {post.org_name}</span>
                <Link
                  href={`/posts/${post.id}`}
                  className="font-semibold text-[#1a73e8] hover:underline"
                >
                  생활 꿀팁·체크리스트 전체 보기 →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdSenseSlot position="bottom" />
    </div>
  );
}
