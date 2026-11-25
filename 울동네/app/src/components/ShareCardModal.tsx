import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { parseSummaryRows } from '../screens/DetailScreen';
import type { WelfarePost } from '../types/welfare';
import { getDdayLabel } from './WelfareCard';

const WEB_BASE_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000').replace(/\/+$/, '');

interface ShareCardModalProps {
  visible: boolean;
  post: WelfarePost | null;
  isDark?: boolean;
  onClose: () => void;
  onComplete?: (message: string) => void;
}

export function ShareCardModal({
  visible,
  post,
  isDark = false,
  onClose,
  onComplete
}: ShareCardModalProps) {
  const [sharing, setSharing] = useState(false);

  if (!visible || !post) {
    return null;
  }

  const dday = getDdayLabel(post.deadline_date);
  const summaryRows = parseSummaryRows(post.app_summary_3lines).slice(0, 4);
  const shareUrl = `${WEB_BASE_URL}/share/${post.id}`;

  async function handleShareLink() {
    if (!post || sharing) return;
    setSharing(true);

    const shareMessage = `[울동네] ${post.app_title}\n우리 동네 복지 혜택 알림에서 확인하세요.\n${shareUrl}`;

    try {
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (nav?.share) {
          try {
            await nav.share({
              title: post.app_title,
              text: `[울동네] ${post.app_title}`,
              url: shareUrl
            });
            onClose();
            return;
          } catch {
            // 공유 창 취소 시 아래 주소 복사 진행
          }
        }

        if (nav?.clipboard?.writeText) {
          try {
            await nav.clipboard.writeText(shareUrl);
            onClose();
            onComplete?.('공유 카드 주소를 복사했어요.');
            return;
          } catch {
            // 무시
          }
        }

        onClose();
        onComplete?.('공유 카드 주소를 준비했어요.');
        return;
      }

      await Share.share({
        title: post.app_title,
        message: shareMessage
      });
      onClose();
    } catch {
      onClose();
      onComplete?.('공유를 취소했거나 잠시 후 다시 시도해 주세요.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, isDark && styles.sheetDark]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, isDark && styles.textDark]}>공유 카드 미리보기</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, isDark && styles.textMutedDark]}>닫기</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <View style={styles.captureCanvas}>
              <View style={styles.previewCard}>
                <View style={styles.badgeRow}>
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionBadgeText}>
                      {post.region_code === '00000' ? '전국 공통' : post.region_sigungu}
                    </Text>
                  </View>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{post.category}</Text>
                  </View>
                  {dday ? (
                    <View style={[styles.ddayBadge, dday.isUrgent && styles.ddayUrgent]}>
                      <Text style={[styles.ddayText, dday.isUrgent && styles.ddayUrgentText]}>
                        {dday.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.cardTitle}>{post.app_title}</Text>

                <View style={styles.summaryList}>
                  {summaryRows.map((row, idx) => (
                    <View key={`${row.label ?? 'line'}-${idx}`} style={styles.summaryRow}>
                      {row.label ? (
                        <Text style={styles.summaryLabel}>{row.label}</Text>
                      ) : null}
                      <Text style={styles.summaryValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.orgText}>출처: {post.org_name}</Text>
              </View>

              {/* 하단 앱 소개 안내 */}
              <View style={styles.appPromoBox}>
                <Text style={styles.appPromoBrand}>우리 동네 복지 혜택 알림 · 울동네</Text>
                <Text style={styles.appPromoDesc}>
                  회원가입 없이 10초 만에 내 동네 지원금·혜택을 받아보세요.
                </Text>
                <Text style={styles.appStoreHint}>
                  스토어에서 &apos;울동네&apos;를 검색해 보세요.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={() => void handleShareLink()}
              disabled={sharing}
              style={styles.shareBtn}
            >
              {sharing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.shareBtnText}>공유하기 (카드 링크 보내기)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  sheet: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden'
  },
  sheetDark: {
    backgroundColor: '#1b1f27'
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed'
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124'
  },
  closeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368'
  },
  scrollBody: {
    padding: 14
  },
  captureCanvas: {
    backgroundColor: '#eff2f6',
    borderRadius: 16,
    padding: 12,
    gap: 10
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dfe3ea',
    padding: 16
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
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
    fontSize: 11,
    fontWeight: '700'
  },
  categoryPill: {
    backgroundColor: '#fff1e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  categoryText: {
    color: '#b85418',
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
    fontSize: 11,
    fontWeight: '700'
  },
  ddayUrgentText: {
    color: '#c5221f'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    lineHeight: 23,
    marginBottom: 10
  },
  summaryList: {
    gap: 6,
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  summaryLabel: {
    minWidth: 48,
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 19
  },
  summaryValue: {
    flex: 1,
    fontSize: 13,
    color: '#3c4043',
    lineHeight: 19
  },
  orgText: {
    fontSize: 11,
    color: '#5f6368',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 8
  },
  appPromoBox: {
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#cfe0fc',
    borderRadius: 12,
    padding: 14
  },
  appPromoBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a73e8',
    marginBottom: 4
  },
  appPromoDesc: {
    fontSize: 12,
    color: '#3c4043',
    lineHeight: 18,
    marginBottom: 6
  },
  appStoreHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1967d2'
  },
  footerActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed'
  },
  shareBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  }
});
