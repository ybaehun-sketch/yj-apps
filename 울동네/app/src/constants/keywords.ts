import type { WelfareCategory } from '../types/welfare';

export const STANDARD_CATEGORIES: WelfareCategory[] = [
  '돌봄/육아',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '생활/문화'
];

export const RECOMMENDED_KEYWORDS: string[] = [
  '돌봄/육아',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '출산지원',
  '생활/문화'
];

/**
 * 사용자가 직접 입력한 단어가 공고 키워드와 1글자 차이로 어긋나지 않도록
 * 대표적인 유사어/동의어를 함께 매핑
 */
const SYNONYM_GROUPS: string[][] = [
  ['방학돌봄', '겨울돌봄', '여름돌봄', '초등돌봄', '돌봄교실', '아이돌봄'],
  ['난방비', '에너지바우처', '등유', '연탄', '가스비'],
  ['대상포진', '예방접종', '독감', '건강검진', '어르신건강'],
  ['소상공인', '자영업', '경영안정', '임대료', '창업'],
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
