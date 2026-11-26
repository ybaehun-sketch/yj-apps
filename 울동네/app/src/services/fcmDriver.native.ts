import { PermissionsAndroid, Platform } from 'react-native';
import type { NotificationTapPayload } from './fcmDriver';

interface FirebaseRemoteMessage {
  data?: Record<string, string | undefined>;
}

interface FirebaseMessagingInstance {
  requestPermission: () => Promise<number>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
  onNotificationOpenedApp: (cb: (msg: FirebaseRemoteMessage) => void) => () => void;
  getInitialNotification: () => Promise<FirebaseRemoteMessage | null>;
}

function getMessagingInstance(): FirebaseMessagingInstance | null {
  try {
    // 네이티브 빌드(@react-native-firebase/messaging 설치 및 google-services.json 연동 후)에서만 활성화
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/messaging');
    const factory = mod?.default ?? mod;
    if (typeof factory === 'function') {
      return factory() as FirebaseMessagingInstance;
    }
    return null;
  } catch {
    return null;
  }
}

function extractPayload(msg: FirebaseRemoteMessage | null): NotificationTapPayload | null {
  const data = msg?.data;
  if (!data) return null;
  const postId = typeof data.post_id === 'string' ? data.post_id.trim() : '';
  const externalId = typeof data.external_id === 'string' ? data.external_id.trim() : '';
  if (!postId && !externalId) return null;
  return {
    postId: postId || undefined,
    externalId: externalId || undefined
  };
}

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const messaging = getMessagingInstance();
  if (!messaging) return false;

  try {
    const authStatus = await messaging.requestPermission();
    // AUTHORIZED (1) or PROVISIONAL (2)
    return authStatus === 1 || authStatus === 2;
  } catch {
    return false;
  }
}

export async function subscribeTopic(topic: string): Promise<void> {
  const messaging = getMessagingInstance();
  if (!messaging) return;
  await messaging.subscribeToTopic(topic);
}

export async function unsubscribeTopic(topic: string): Promise<void> {
  const messaging = getMessagingInstance();
  if (!messaging) return;
  await messaging.unsubscribeFromTopic(topic);
}

export function listenNotificationOpen(
  onOpen: (payload: NotificationTapPayload) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  let active = true;

  void messaging
    .getInitialNotification()
    .then((initialMsg) => {
      if (!active) return;
      const payload = extractPayload(initialMsg);
      if (payload) onOpen(payload);
    })
    .catch(() => {
      // 초기 알림 조회 실패 무시
    });

  const unsubscribe = messaging.onNotificationOpenedApp((remoteMsg) => {
    const payload = extractPayload(remoteMsg);
    if (payload) onOpen(payload);
  });

  return () => {
    active = false;
    try {
      unsubscribe();
    } catch {
      // 구독 해제 오류 무시
    }
  };
}
