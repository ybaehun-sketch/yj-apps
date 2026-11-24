import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { parseSummaryRows } from '../screens/DetailScreen';
import type { WelfarePost } from '../types/welfare';

interface WelfareCardProps {
  post: WelfarePost;
  largeText: boolean;
  isDark?: boolean;
  onPress: () => void;
}

export function getDdayLabel(deadlineDate: string | null): {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
} | null {
  if (!deadlineDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadlineDate}T00:00:00`);
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: '마감', isUrgent: false, isExpired: true };
  if (diffDays === 0) return { label: '오늘 마감', isUrgent: true, isExpired: false };
  if (diffDays <= 7) return { label: `D-${diffDays}`, isUrgent: true, isExpired: false };
  return { label: `D-${diffDays}`, isUrgent: false, isExpired: false };
}

export const UNIFIED_CATEGORY_PILL_COLOR = {
  bg: '#fff1e8',
  text: '#b85418',
  bgDark: '#3b261c',
  textDark: '#f6b187'
};

export const CATEGORY_PILL_COLORS: Record<string, { bg: string; text: string; bgDark: string; textDark: string }> = {
  '돌봄/육아': UNIFIED_CATEGORY_PILL_COLOR,
  '어르신/건강': UNIFIED_CATEGORY_PILL_COLOR,
  '주거/난방비': UNIFIED_CATEGORY_PILL_COLOR,
  '소상공인/일자리': UNIFIED_CATEGORY_PILL_COLOR,
  '생활/문화': UNIFIED_CATEGORY_PILL_COLOR
};

export function WelfareCard({
  post,
  largeText,
  isDark = false,
  onPress
}: WelfareCardProps) {
  const dday = getDdayLabel(post.deadline_date);
  const catStyle = CATEGORY_PILL_COLORS[post.category] ?? UNIFIED_CATEGORY_PILL_COLOR;
  const summaryRows = parseSummaryRows(post.app_summary_3lines);
  const keepAllStyle = Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as any) : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, isDark && styles.cardDark]}
    >
      <View style={styles.badgeRow}>
        <View style={styles.regionBadge}>
          <Text style={styles.regionBadgeText}>
            {post.region_code === '00000' ? '전국 공통' : post.region_sigungu}
          </Text>
        </View>
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: isDark ? catStyle.bgDark : catStyle.bg }
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: isDark ? catStyle.textDark : catStyle.text }
            ]}
          >
            {post.category}
          </Text>
        </View>
        {dday ? (
          <View style={[styles.ddayBadge, dday.isUrgent && styles.ddayUrgent]}>
            <Text style={[styles.ddayText, dday.isUrgent && styles.ddayUrgentText]}>
              {dday.label}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.title, largeText && styles.titleLarge, isDark && styles.textDark, keepAllStyle]}
        numberOfLines={2}
      >
        {post.app_title}
      </Text>

      <View style={[styles.summaryList, largeText && styles.summaryListLarge]}>
        {summaryRows.map((row, idx) => (
          <View key={`${row.label ?? 'line'}-${idx}`} style={styles.summaryRow}>
            {row.label ? (
              <Text
                style={[
                  styles.summaryLabel,
                  largeText && styles.summaryLabelLarge,
                  isDark && styles.summaryLabelDark
                ]}
              >
                {row.label}
              </Text>
            ) : null}
            <Text
              style={[
                styles.summaryValue,
                largeText && styles.summaryLarge,
                isDark && styles.textMutedDark,
                keepAllStyle
              ]}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footerRow, isDark && styles.footerRowDark]}>
        <Text style={[styles.orgText, isDark && styles.textMutedDark]}>{post.org_name}</Text>
        <Text style={styles.moreText}>자세히 보기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fcfbf8',
    borderWidth: 1,
    borderColor: '#dfe3ea',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  regionBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  regionBadgeText: {
    color: '#1a73e8',
    fontSize: 12,
    fontWeight: '700'
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  categoryText: {
    color: '#5f6368',
    fontSize: 12,
    fontWeight: '700'
  },
  ddayBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  ddayUrgent: {
    backgroundColor: '#fce8e6'
  },
  ddayText: {
    color: '#5f6368',
    fontSize: 12,
    fontWeight: '700'
  },
  ddayUrgentText: {
    color: '#c5221f'
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124',
    lineHeight: 25,
    marginBottom: 12
  },
  titleLarge: {
    fontSize: 20,
    lineHeight: 29
  },
  summaryList: {
    gap: 7
  },
  summaryListLarge: {
    gap: 9
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  summaryLabel: {
    minWidth: 52,
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 21
  },
  summaryLabelLarge: {
    minWidth: 58,
    fontSize: 15,
    lineHeight: 24
  },
  summaryLabelDark: {
    color: '#e5e7eb'
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: '#3c4043',
    lineHeight: 21
  },
  summaryLarge: {
    fontSize: 16,
    lineHeight: 24
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4'
  },
  footerRowDark: {
    borderTopColor: '#2d3340'
  },
  orgText: {
    fontSize: 12,
    color: '#5f6368'
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8'
  }
});
