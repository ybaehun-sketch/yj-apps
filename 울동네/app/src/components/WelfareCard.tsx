import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { parseSummaryRows } from '../screens/DetailScreen';
import type { WelfarePost } from '../types/welfare';

interface WelfareCardProps {
  post: WelfarePost;
  matchedKeywords?: string[];
  largeText: boolean;
  isDark?: boolean;
  isFavorite?: boolean;
  isMenuOpen?: boolean;
  onPress: () => void;
  onToggleMenu?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
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
  '돌봄/아동/청소년': UNIFIED_CATEGORY_PILL_COLOR,
  '어르신/건강': UNIFIED_CATEGORY_PILL_COLOR,
  '주거/난방비': UNIFIED_CATEGORY_PILL_COLOR,
  '소상공인/일자리': UNIFIED_CATEGORY_PILL_COLOR,
  '농림/축산/어업': UNIFIED_CATEGORY_PILL_COLOR,
  '생활/문화/법률': UNIFIED_CATEGORY_PILL_COLOR,
  '다문화': UNIFIED_CATEGORY_PILL_COLOR
};

export function WelfareCard({
  post,
  matchedKeywords,
  largeText,
  isDark = false,
  isFavorite = false,
  isMenuOpen = false,
  onPress,
  onToggleMenu,
  onShare,
  onToggleFavorite,
  onDelete
}: WelfareCardProps) {
  const dday = getDdayLabel(post.deadline_date);
  const catStyle = CATEGORY_PILL_COLORS[post.category] ?? UNIFIED_CATEGORY_PILL_COLOR;
  const displayTags =
    matchedKeywords && matchedKeywords.length > 0
      ? matchedKeywords.map((kw) => `#${kw}`)
      : [post.category];
  const summaryRows = parseSummaryRows(post.app_summary_3lines).slice(0, 3);
  const keepAllStyle = Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as any) : undefined;

  return (
    <View style={[styles.cardWrap, isMenuOpen && styles.cardWrapActive]}>
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
          {displayTags.map((tag) => (
            <View
              key={tag}
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
                {tag}
              </Text>
            </View>
          ))}
          <View style={styles.rightActionWrap}>
            {isFavorite ? (
              <View style={[styles.favBadge, isDark && styles.favBadgeDark]}>
                <Text style={styles.favBadgeText}>★</Text>
              </View>
            ) : null}
            {dday ? (
              <View style={[styles.ddayBadge, dday.isUrgent && styles.ddayUrgent]}>
                <Text style={[styles.ddayText, dday.isUrgent && styles.ddayUrgentText]}>
                  {dday.label}
                </Text>
              </View>
            ) : null}
            {onToggleMenu ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  onToggleMenu();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[styles.moreMenuBtn, isDark && styles.moreMenuBtnDark]}
                accessibilityLabel="카드 더보기 메뉴"
              >
                <Text style={[styles.moreMenuDots, isDark && styles.textMutedDark]}>⋮</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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

      {isMenuOpen ? (
        <View style={[styles.dropdownMenu, isDark && styles.dropdownMenuDark]}>
          <TouchableOpacity
            onPress={() => onShare?.()}
            style={[styles.dropdownItem, isDark && styles.dropdownItemBorderDark]}
          >
            <Text style={[styles.dropdownItemText, isDark && styles.textDark]}>공유하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onToggleFavorite?.()}
            style={[styles.dropdownItem, isDark && styles.dropdownItemBorderDark]}
          >
            <Text style={[styles.dropdownItemText, isFavorite && styles.dropdownFavActiveText, isDark && styles.textDark]}>
              {isFavorite ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete?.()}
            style={[styles.dropdownItem, styles.dropdownItemLast]}
          >
            <Text style={styles.dropdownDeleteText}>삭제하기</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    position: 'relative',
    zIndex: 1
  },
  cardWrapActive: {
    zIndex: 50
  },
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
  rightActionWrap: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  favBadge: {
    backgroundColor: '#fef7e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  favBadgeDark: {
    backgroundColor: '#3a3017'
  },
  favBadgeText: {
    color: '#e37400',
    fontSize: 12,
    fontWeight: '700'
  },
  ddayBadge: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  moreMenuBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  moreMenuBtnDark: {
    backgroundColor: 'transparent'
  },
  moreMenuDots: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5f6368',
    lineHeight: 20
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
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 14,
    width: 136,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 60,
    overflow: 'hidden'
  },
  dropdownMenuDark: {
    backgroundColor: '#252a34',
    borderColor: '#3a4150'
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4'
  },
  dropdownItemBorderDark: {
    borderBottomColor: '#333a47'
  },
  dropdownItemLast: {
    borderBottomWidth: 0
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124'
  },
  dropdownFavActiveText: {
    color: '#b06000'
  },
  dropdownDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c5221f'
  }
});
