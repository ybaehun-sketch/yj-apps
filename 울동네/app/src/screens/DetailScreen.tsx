import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CATEGORY_PILL_COLORS, getDdayLabel, UNIFIED_CATEGORY_PILL_COLOR } from '../components/WelfareCard';
import { openWithCooldownInterstitial } from '../services/adService';
import type { WelfarePost } from '../types/welfare';

interface DetailScreenProps {
  post: WelfarePost;
  largeText: boolean;
  isDark?: boolean;
  onBack: () => void;
}

export interface SummaryRow {
  label: string | null;
  value: string;
}

export function parseSummaryRows(raw: string): SummaryRow[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(대상|혜택|신청방법|지원대상|지원내용|문의)\s*[:：]\s*(.+)$/);
      if (m) {
        return { label: m[1], value: m[2].trim() };
      }
      return { label: null, value: line };
    });
}

function splitReadableParagraphs(raw: string): string[] {
  const normalized = (raw || '').trim();
  if (!normalized) return [];

  const explicitParagraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [normalized];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(' '));
  }
  return paragraphs;
}

export function DetailScreen({ post, largeText, isDark = false, onBack }: DetailScreenProps) {
  const dday = getDdayLabel(post.deadline_date);
  const summaryRows = parseSummaryRows(post.app_summary_3lines);
  const detailParagraphs = splitReadableParagraphs(post.app_detail_summary);
  const catStyle = CATEGORY_PILL_COLORS[post.category] ?? UNIFIED_CATEGORY_PILL_COLOR;

  function handleOpenSource() {
    openWithCooldownInterstitial(() => {
      WebBrowser.openBrowserAsync(post.source_url);
    });
  }

  function handleCallPhone() {
    if (!post.contact_phone) return;
    Linking.openURL(`tel:${post.contact_phone}`);
  }

  return (
    <View style={[styles.wrapper, isDark && styles.wrapperDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 목록으로</Text>
        </TouchableOpacity>
        <Text style={[styles.headerOrg, isDark && styles.textMutedDark]}>{post.org_name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {post.region_code === '00000' ? '전국 공통' : post.region_sigungu}
            </Text>
          </View>
          <View
            style={[
              styles.categoryPill,
              { backgroundColor: isDark ? catStyle.bgDark : catStyle.bg }
            ]}
          >
            <Text style={[styles.category, { color: isDark ? catStyle.textDark : catStyle.text }]}>
              {post.category}
            </Text>
          </View>
          {post.deadline_date ? (
            <Text style={styles.deadline}>
              마감 {post.deadline_date}
              {dday ? ` (${dday.label})` : ''}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.title, largeText && styles.titleLarge, isDark && styles.textDark]}>
          {post.app_title}
        </Text>

        {post.has_attachment_only ? (
          <View style={styles.attachmentNotice}>
            <Text style={styles.attachmentNoticeText}>
              본 공고는 지자체 첨부파일(한글/PDF)에 상세 안내가 포함되어 있습니다. 아래 원문·첨부파일 버튼을 눌러 확인해 주세요.
            </Text>
          </View>
        ) : null}

        <View style={[styles.summaryBox, isDark && styles.summaryBoxDark]}>
          <Text style={styles.summaryLabel}>핵심 요약</Text>
          <View style={styles.summaryRowsWrap}>
            {summaryRows.map((row, idx) => (
              <View key={`${row.label ?? 'line'}-${idx}`} style={styles.summaryRow}>
                {row.label ? (
                  <View style={[styles.summaryKeyBadge, isDark && styles.summaryKeyBadgeDark]}>
                    <Text style={[styles.summaryKeyText, isDark && styles.summaryKeyTextDark]}>
                      {row.label}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.summaryText, largeText && styles.textLarge, isDark && styles.textDark]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.detailCard, isDark && styles.detailCardDark]}>
          {detailParagraphs.map((paragraph, idx) => (
            <Text
              key={`p-${idx}`}
              style={[
                styles.detailText,
                largeText && styles.textLarge,
                isDark && styles.detailTextDark,
                idx === detailParagraphs.length - 1 && styles.detailTextLast
              ]}
            >
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleOpenSource} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {post.has_attachment_only
                ? '공고 원문·첨부파일 확인 ↗'
                : '공고 원문 / 신청 바로가기 ↗'}
            </Text>
          </TouchableOpacity>

          {post.contact_phone ? (
            <TouchableOpacity onPress={handleCallPhone} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>
                문의처 전화 연결 ({post.contact_phone})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            공식 출처: {post.org_name}{'\n'}
            본 앱은 정부·지자체 공식 앱이 아닌 민간 생활정보 큐레이션 서비스이며, 최종 확인과 신청은 공식 출처에서 진행하셔야 합니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#eff2f6'
  },
  wrapperDark: {
    backgroundColor: '#12151b'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e7ed'
  },
  headerDark: {
    backgroundColor: '#171b23',
    borderBottomColor: '#2d323e'
  },
  backBtn: {
    paddingVertical: 4
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a73e8'
  },
  headerOrg: {
    fontSize: 13,
    color: '#5f6368'
  },
  content: {
    padding: 18,
    paddingBottom: 28
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8'
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6368'
  },
  deadline: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '700',
    color: '#c5221f'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202124',
    lineHeight: 30,
    marginBottom: 16
  },
  titleLarge: {
    fontSize: 25,
    lineHeight: 34
  },
  attachmentNotice: {
    backgroundColor: '#fef7e0',
    borderWidth: 1,
    borderColor: '#fdd663',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16
  },
  attachmentNoticeText: {
    fontSize: 13,
    color: '#b06000',
    lineHeight: 20,
    fontWeight: '600'
  },
  summaryBox: {
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#cfe0fc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  },
  summaryBoxDark: {
    backgroundColor: '#1a2230',
    borderColor: '#2d3544'
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 10
  },
  summaryRowsWrap: {
    gap: 10
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  summaryKeyBadge: {
    width: 66,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d2e3fc',
    borderRadius: 6,
    paddingVertical: 3,
    alignItems: 'center',
    marginTop: 1
  },
  summaryKeyBadgeDark: {
    backgroundColor: '#233554',
    borderColor: '#364d75'
  },
  summaryKeyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1967d2'
  },
  summaryKeyTextDark: {
    color: '#8ab4f8'
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    color: '#202124',
    lineHeight: 23
  },
  detailCard: {
    backgroundColor: '#fcfbf8',
    borderWidth: 1,
    borderColor: '#dfe3ea',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20
  },
  detailCardDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  detailText: {
    fontSize: 16,
    color: '#3c4043',
    lineHeight: 27,
    marginBottom: 14
  },
  detailTextDark: {
    color: '#e8eaed'
  },
  detailTextLast: {
    marginBottom: 0
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 30
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  },
  actions: {
    gap: 10,
    marginBottom: 24
  },
  primaryBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: '#202124',
    fontSize: 14,
    fontWeight: '600'
  },
  disclaimerBox: {
    borderTopWidth: 1,
    borderTopColor: '#dadce0',
    paddingTop: 14
  },
  disclaimerText: {
    fontSize: 12,
    color: '#5f6368',
    lineHeight: 19
  }
});
