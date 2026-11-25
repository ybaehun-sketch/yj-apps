import type { RefObject } from 'react';
import type { View } from 'react-native';

export async function shareNativeCardImage(
  _cardRef: RefObject<View | null>,
  _title: string,
  _appDownloadUrl: string
): Promise<void> {
  // 웹 환경에서는 ShareCardModal 내부 캔버스 이미지 저장/공유 경로를 사용함
}
