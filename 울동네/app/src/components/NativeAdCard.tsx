import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NativeAdCardProps {
  largeText: boolean;
  isDark?: boolean;
}

/**
 * 심사 전 앱 형태 구성용 목업 네이티브 광고 카드.
 * 일반 소식 카드와 비슷한 결을 유지하되, 좌측 상단 [AD] 배지로 광고임을 명확히 구분.
 */
export function NativeAdCard({ largeText, isDark = false }: NativeAdCardProps) {
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.badgeRow}>
        <View style={[styles.adBadge, isDark && styles.adBadgeDark]}>
          <Text style={[styles.adBadgeText, isDark && styles.adBadgeTextDark]}>AD</Text>
        </View>
        <Text style={[styles.sponsorText, isDark && styles.textMutedDark]}>
          스폰서 추천 정보 (목업 광고)
        </Text>
      </View>

      <Text style={[styles.title, largeText && styles.titleLarge, isDark && styles.textDark]}>
        우리 동네 알뜰 생활 혜택·금융 파트너 안내
      </Text>
      <Text style={[styles.body, largeText && styles.bodyLarge, isDark && styles.textMutedDark]}>
        스토어 심사 및 애드몹 연동 전까지 앱 화면 구성을 확인하기 위한 목업 광고 카드입니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  cardDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  adBadge: {
    backgroundColor: '#e8eaed',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4
  },
  adBadgeDark: {
    backgroundColor: '#323844'
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f6368'
  },
  adBadgeTextDark: {
    color: '#9aa0a6'
  },
  sponsorText: {
    fontSize: 12,
    color: '#5f6368'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 6
  },
  titleLarge: {
    fontSize: 19
  },
  body: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  }
});
