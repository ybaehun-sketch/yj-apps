import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export async function shareNativeCardImage(
  cardRef: RefObject<View | null>,
  title: string,
  appDownloadUrl: string
): Promise<void> {
  if (cardRef.current) {
    const uri = await captureRef(cardRef as Parameters<typeof captureRef>[0], {
      format: 'png',
      quality: 0.95
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${title} 공유하기`
      });
      return;
    }
  }

  await Share.share({
    title,
    message: `[울동네] ${title}\n우리 동네 지원금·혜택 알림 앱\n다운로드: ${appDownloadUrl}`
  });
}
