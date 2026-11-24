import Constants from 'expo-constants';
import type { WelfarePost } from '../types/welfare';

function getSupabaseConfig() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const url = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

/**
 * 선택한 지역(region_code) + 전국 공통('00000')의 발행된 복지 공고 조회
 */
export async function fetchFeedPosts(
  regionCode: string,
  limit = 40
): Promise<WelfarePost[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    // 초기 로컬 미리보기용 샘플 데이터 반환 (연동 전 UI 확인용)
    return getSamplePosts(regionCode).slice(0, limit);
  }

  const query =
    `${url}/rest/v1/uldongne_welfare_posts` +
    `?app_status=eq.published&region_code=in.(${encodeURIComponent(regionCode)},00000)` +
    `&order=app_published_at.desc.nullslast,created_at.desc&limit=${limit}`;

  const res = await fetch(query, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`공고 목록을 불러오지 못했습니다. (${res.status})`);
  }
  return (await res.json()) as WelfarePost[];
}

function getSamplePosts(regionCode: string): WelfarePost[] {
  const regionName = regionCode === '51720' ? '홍천군' : '우리 동네';
  return [
    {
      id: 'sample-1',
      region_sido: '강원특별자치도',
      region_sigungu: regionName,
      region_code: regionCode,
      org_name: `${regionName}청 복지정책과`,
      category: '주거/난방비',
      keywords: ['난방비', '에너지바우처', regionName],
      app_title: '취약계층 겨울철 난방비 특별 지원',
      app_summary_3lines: `대상: ${regionName} 기초생활수급자 및 차상위계층\n혜택: 가구당 최대 30만 원 난방비 지원\n신청방법: 읍·면 행정복지센터 방문 또는 복지로`,
      app_detail_summary: `${regionName} 거주 에너지 취약계층의 겨울철 난방비 부담을 덜어드리기 위한 지원 사업입니다. 신분증을 지참해 관할 행정복지센터에 신청하시면 심사 후 계좌 또는 바우처로 지원됩니다.`,
      publish_to_blog: true,
      has_attachment_only: false,
      deadline_date: '2026-12-31',
      contact_phone: '033-430-2000',
      source_url: 'https://www.hongcheon.go.kr',
      published_at: new Date().toISOString()
    },
    {
      id: 'sample-2',
      region_sido: '강원특별자치도',
      region_sigungu: regionName,
      region_code: regionCode,
      org_name: `${regionName}가족센터`,
      category: '돌봄/육아',
      keywords: ['방학돌봄', '초등돌봄', '돌봄/육아'],
      app_title: '초등 겨울방학 온종일 돌봄교실 모집',
      app_summary_3lines: `대상: ${regionName} 거주 초등학생 1~3학년\n혜택: 평일 오전 9시~오후 5시 무료 돌봄·체험\n신청방법: 가족센터 홈페이지 선착순 접수`,
      app_detail_summary: '방학 중 맞벌이 가정의 돌봄 공백을 해소하기 위한 무료 돌봄 프로그램입니다. 상세 신청 서식은 첨부된 안내문을 확인해 주세요.',
      publish_to_blog: false,
      has_attachment_only: true,
      deadline_date: '2026-12-15',
      contact_phone: '033-430-3000',
      source_url: 'https://hongcheon.familynet.or.kr',
      published_at: new Date(Date.now() - 3600 * 1000).toISOString()
    }
  ];
}
