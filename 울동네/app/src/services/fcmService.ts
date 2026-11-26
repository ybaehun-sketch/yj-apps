import { expandKeywordsWithSynonyms } from '../constants/keywords';
import {
  listenNotificationOpen,
  requestPushPermission,
  subscribeTopic,
  unsubscribeTopic,
  type NotificationTapPayload
} from './fcmDriver';
import { loadSubscribedTopics, saveSubscribedTopics } from './storageService';

function toSafeTopic(prefix: string, rawKeyword: string): string {
  const encoded = encodeURIComponent(rawKeyword.trim()).replace(/%/g, '_');
  return `${prefix}_${encoded}`.slice(0, 120);
}

function buildTargetTopics(regionCode: string, keywords: string[]): string[] {
  const topics = new Set<string>();
  topics.add(`region_${regionCode}`);

  const expanded = expandKeywordsWithSynonyms(keywords);
  for (const kw of expanded.slice(0, 15)) {
    topics.add(toSafeTopic(`kw_${regionCode}`, kw));
  }
  return Array.from(topics);
}

/**
 * 온보딩/설정 저장 시 백그라운드에서 해당 지역 + 관심 키워드 FCM 토픽 구독 동기화.
 * 이전 지역·키워드 토픽은 자동 해제하고, 알림 꺼짐 시 모든 토픽 구독을 해제함.
 */
export async function syncFcmTopicSubscriptions(
  regionCode: string,
  keywords: string[],
  enabled = true
): Promise<string[]> {
  const prevTopics = await loadSubscribedTopics();

  if (!enabled) {
    if (prevTopics.length > 0) {
      await Promise.allSettled(prevTopics.map((topic) => unsubscribeTopic(topic)));
      await saveSubscribedTopics([]);
    }
    return [];
  }

  const permitted = await requestPushPermission();
  if (!permitted) {
    return [];
  }

  const nextTopics = buildTargetTopics(regionCode, keywords);
  const nextSet = new Set(nextTopics);
  const prevSet = new Set(prevTopics);

  const toUnsubscribe = prevTopics.filter((t) => !nextSet.has(t));
  const toSubscribe = nextTopics.filter((t) => !prevSet.has(t));

  await Promise.allSettled([
    ...toUnsubscribe.map((topic) => unsubscribeTopic(topic)),
    ...toSubscribe.map((topic) => subscribeTopic(topic))
  ]);

  await saveSubscribedTopics(nextTopics);
  return nextTopics;
}

export function registerNotificationTapHandler(
  onOpen: (payload: NotificationTapPayload) => void
): () => void {
  return listenNotificationOpen(onOpen);
}
