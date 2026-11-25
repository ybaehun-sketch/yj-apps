import type { RefObject } from 'react';
import type { View } from 'react-native';

export declare function shareNativeCardImage(
  cardRef: RefObject<View | null>,
  title: string,
  appDownloadUrl: string
): Promise<void>;
