import { ImageResponse } from 'next/og';
import { fetchPublishedPostById } from '@/lib/supabase';

export const runtime = 'nodejs';
export const alt = '울동네 - 우리 동네 복지 혜택 알림';
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

async function loadKoreanFont(): Promise<ArrayBuffer | undefined> {
  try {
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700&display=swap',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    if (!cssRes.ok) return undefined;
    const css = await cssRes.text();
    const match = css.match(/url\((https:\/\/[^)]+)\)/);
    if (!match?.[1]) return undefined;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return undefined;
    return await fontRes.arrayBuffer();
  } catch {
    return undefined;
  }
}

export default async function ShareOgImage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await fetchPublishedPostById(id);
  const fontData = await loadKoreanFont();

  const regionLabel = post
    ? post.region_code === '00000'
      ? '전국 공통'
      : post.region_sigungu
    : '울동네';
  const categoryLabel = post?.category ?? '생활·복지';
  const title = post?.app_title ?? '우리 동네 복지 혜택 알림';
  const summaryLines = (post?.app_summary_3lines ?? '내 동네에 꼭 맞는 지원금과 복지 소식을 확인해 보세요.')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#eff2f6',
          padding: '36px 44px',
          fontFamily: fontData ? 'NotoSansKR' : 'sans-serif'
        }}
      >
        {/* 상단 카드 영역 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '2px solid #dfe3ea',
            padding: '32px 36px',
            flex: 1,
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                backgroundColor: '#e8f0fe',
                color: '#1a73e8',
                fontSize: '20px',
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: '10px'
              }}
            >
              {regionLabel}
            </div>
            <div
              style={{
                backgroundColor: '#fff1e8',
                color: '#b85418',
                fontSize: '20px',
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: '10px'
              }}
            >
              {categoryLabel}
            </div>
          </div>

          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#202124',
              lineHeight: 1.35,
              marginBottom: '20px'
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {summaryLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: '23px',
                  color: '#3c4043',
                  lineHeight: 1.4
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 울동네 앱 홍보 배너 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#eef4ff',
            border: '2px solid #cfe0fc',
            borderRadius: '20px',
            padding: '22px 32px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#1a73e8' }}>
              우리 동네 복지 혜택 알림 · 울동네
            </div>
            <div style={{ fontSize: '20px', color: '#3c4043' }}>
              스토어에서 &apos;울동네&apos;를 검색해 보세요.
            </div>
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a73e8'
            }}
          >
            자세히 보기 →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'NotoSansKR',
              data: fontData,
              style: 'normal',
              weight: 700
            }
          ]
        : undefined
    }
  );
}
