export interface NotificationTapPayload {
  postId?: string;
  externalId?: string;
}

export function requestPushPermission(): Promise<boolean>;
export function subscribeTopic(topic: string): Promise<void>;
export function unsubscribeTopic(topic: string): Promise<void>;
export function listenNotificationOpen(
  onOpen: (payload: NotificationTapPayload) => void
): () => void;
