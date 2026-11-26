import type { NotificationTapPayload } from './fcmDriver';

export async function requestPushPermission(): Promise<boolean> {
  return false;
}

export async function subscribeTopic(_topic: string): Promise<void> {
  // 웹 미리보기(app.wooldongne.com)에서는 네이티브 푸시 토픽 구독을 건너뜀
}

export async function unsubscribeTopic(_topic: string): Promise<void> {
  // 웹 미리보기에서는 네이티브 푸시 토픽 해제를 건너뜀
}

export function listenNotificationOpen(
  _onOpen: (payload: NotificationTapPayload) => void
): () => void {
  return () => {};
}
