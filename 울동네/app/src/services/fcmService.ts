import { expandKeywordsWithSynonyms } from '../constants/keywords';

function toSafeTopic(prefix: string, rawKeyword: string): string {
  const encoded = encodeURIComponent(rawKeyword.trim()).replace(/%/g, '_');
  return `${prefix}_${encoded}`.slice(0, 120);
}

/**
 * 온보딩/설정 저장 시 백그라운드에서 해당 지역 + 관심 키워드 FCM 토픽 구독
 * (네이티브 빌드 시 @react-native-firebase/messaging의 subscribeToTopic 연결)
 */
export async function syncFcmTopicSubscriptions(
  regionCode: string,
  keywords: string[],
  subscribeFn?: (topic: string) => Promise<void>
): Promise<string[]> {
  const topics = new Set<string>();
  topics.add(`region_${regionCode}`);

  const expanded = expandKeywordsWithSynonyms(keywords);
  for (const kw of expanded.slice(0, 15)) {
    topics.add(toSafeTopic(`kw_${regionCode}`, kw));
  }

  const list = Array.from(topics);
  if (subscribeFn) {
    await Promise.allSettled(list.map((topic) => subscribeFn(topic)));
  }
  return list;
}
