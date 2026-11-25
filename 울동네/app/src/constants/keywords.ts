import type { WelfareCategory } from '../types/welfare';

export const STANDARD_CATEGORIES: WelfareCategory[] = [
  '돌봄/아동/청소년',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '농림/축산/어업',
  '생활/문화/법률',
  '다문화'
];

export const RECOMMENDED_KEYWORDS: string[] = [
  '출산지원',
  '장학금',
  '대상포진',
  '창업',
  '월세지원',
  '문화누리'
];

export const ONBOARDING_KEYWORDS: string[] = [
  ...STANDARD_CATEGORIES,
  ...RECOMMENDED_KEYWORDS
];

/**
 * 사용자가 직접 입력한 단어가 공고 키워드와 1글자 차이로 어긋나지 않도록
 * 대표적인 유사어/동의어를 함께 매핑
 */
const SYNONYM_GROUPS: string[][] = [
  ['방학돌봄', '겨울돌봄', '여름돌봄', '초등돌봄', '돌봄교실', '아이돌봄', '취학', '아동', '청소년', '장학금'],
  ['난방비', '에너지바우처', '등유', '연탄', '가스비'],
  ['대상포진', '예방접종', '독감', '건강검진', '어르신건강'],
  ['소상공인', '자영업', '경영안정', '임대료', '창업', '공공일자리', '산불감시원'],
  ['농어업', '농업인', '농림/축산/어업', '유기질비료', '농기계', '어업', '축산'],
  ['법률지원', '법률상담', '국선변론', '법률구조', '채무조정', '생활/문화/법률'],
  ['출산지원', '산후조리', '육아수당', '첫만남', '영아수당']
];

export function expandKeywordsWithSynonyms(userKeywords: string[]): string[] {
  const expanded = new Set<string>();
  for (const raw of userKeywords) {
    const clean = raw.replace(/^#/, '').trim();
    if (!clean) continue;
    expanded.add(clean);

    for (const group of SYNONYM_GROUPS) {
      if (group.some((term) => term.includes(clean) || clean.includes(term))) {
        group.forEach((term) => expanded.add(term));
      }
    }
  }
  return Array.from(expanded);
}

/**
 * 사용자가 선택한 관심 키워드 중 해당 공고와 실제로 일치하는 키워드만 반환
 */
export function findMatchedUserKeywords(
  postTerms: string[],
  userKeywords: string[]
): string[] {
  const normalizedPostTerms = postTerms.map((t) => t.toLowerCase()).filter(Boolean);
  const matched: string[] = [];

  for (const raw of userKeywords) {
    const clean = raw.replace(/^#/, '').trim();
    if (!clean || matched.includes(clean)) continue;

    const expanded = expandKeywordsWithSynonyms([clean]).map((t) => t.toLowerCase());
    const hit = expanded.some((uk) =>
      normalizedPostTerms.some((pt) => pt.includes(uk) || uk.includes(pt))
    );
    if (hit) {
      matched.push(clean);
    }
  }

  return matched;
}
