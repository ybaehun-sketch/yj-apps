import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { WelfarePost } from '../types/welfare';

interface WelfareCardProps {
  post: WelfarePost;
  isKeywordMatch: boolean;
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

export function WelfareCard({
  post,
  isKeywordMatch,
  largeText,
  isDark = false,
  onPress
}: WelfareCardProps) {
  const dday = getDdayLabel(post.deadline_date);

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
        <Text style={styles.categoryText}>{post.category}</Text>
        {isKeywordMatch ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>내 관심</Text>
          </View>
        ) : null}
        {dday ? (
          <View style={[styles.ddayBadge, dday.isUrgent && styles.ddayUrgent]}>
            <Text style={[styles.ddayText, dday.isUrgent && styles.ddayUrgentText]}>
              {dday.label}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, largeText && styles.titleLarge, isDark && styles.textDark]} numberOfLines={2}>
        {post.app_title}
      </Text>

      <Text style={[styles.summary, largeText && styles.summaryLarge, isDark && styles.textMutedDark]}>
        {post.app_summary_3lines}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.orgText, isDark && styles.textMutedDark]}>{post.org_name}</Text>
        <Text style={styles.moreText}>자세히 보기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
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
    marginBottom: 8
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
  categoryText: {
    color: '#5f6368',
    fontSize: 12,
    fontWeight: '600'
  },
  matchBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  matchBadgeText: {
    color: '#137333',
    fontSize: 11,
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
    lineHeight: 24,
    marginBottom: 8
  },
  titleLarge: {
    fontSize: 20,
    lineHeight: 28
  },
  summary: {
    fontSize: 14,
    color: '#3c4043',
    lineHeight: 21
  },
  summaryLarge: {
    fontSize: 16,
    lineHeight: 25
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4'
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
