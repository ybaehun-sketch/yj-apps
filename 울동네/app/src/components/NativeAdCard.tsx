import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NativeAdCardProps {
  largeText: boolean;
}

/**
 * 피드 내 3~4개당 1개 비율로 삽입되는 AdMob Native Advanced 광고 슬롯.
 * 일반 소식 카드와 동일한 테두리·폰트·여백을 유지하되, 좌측 상단 [광고] 배지와 미세한 배경색으로 구분.
 */
export function NativeAdCard({ largeText }: NativeAdCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>광고</Text>
        </View>
        <Text style={styles.sponsorText}>추천 생활 정보</Text>
      </View>

      <Text style={[styles.title, largeText && styles.titleLarge]}>
        Google AdMob 네이티브 광고 영역
      </Text>
      <Text style={[styles.body, largeText && styles.bodyLarge]}>
        실제 스토어 빌드 시 이 자리에 AdMob Native Advanced 광고가 자연스럽게 표시됩니다.
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
  adBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f6368'
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
  }
});
