import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface NativeAdCardProps {
  largeText?: boolean;
  isDark?: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const REAL_BANNER_ID = (extra.admobBannerUnitId ?? extra.admobNativeUnitId ?? '').trim();
// 개발/디버그 단계나 ID 미지정 시에는 구글 공식 테스트 배너 ID 사용
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : (REAL_BANNER_ID || TestIds.BANNER);

/**
 * 피드 카드 사이에 자연스럽게 노출되는 구글 애드몹 배너 카드 컴포넌트
 */
export function NativeAdCard({ isDark = false }: NativeAdCardProps) {
  const [canRender, setCanRender] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // 앱 시작 시 광고 초기화 완료 후 렌더링되도록 0.5초 안전 딜레이 적용
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 웹 브라우저 환경이거나 광고 로드 실패 또는 초기화 전에는 공간을 차지하지 않음
  if (Platform.OS === 'web' || !canRender || adFailed) {
    return null;
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true
          }}
          onAdFailedToLoad={() => {
            setAdFailed(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  containerDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  adWrapper: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  }
});
