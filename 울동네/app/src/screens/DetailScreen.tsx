import Constants from 'expo-constants';
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
import { openWithCooldownInterstitial } from '../services/adService';
import type { WelfarePost } from '../types/welfare';

interface DetailScreenProps {
  post: WelfarePost;
  largeText: boolean;
  onBack: () => void;
}

export function DetailScreen({ post, largeText, onBack }: DetailScreenProps) {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const blogBaseUrl = extra.webBlogBaseUrl || 'https://uldongne.pages.dev';

  function handleOpenSource() {
    openWithCooldownInterstitial(() => {
      WebBrowser.openBrowserAsync(post.source_url);
    });
  }

  function handleOpenBlog() {
    WebBrowser.openBrowserAsync(`${blogBaseUrl}/posts/${post.id}`);
  }

  function handleCallPhone() {
    if (!post.contact_phone) return;
    Linking.openURL(`tel:${post.contact_phone}`);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 목록으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerOrg}>{post.org_name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {post.region_code === '00000' ? '전국 공통' : post.region_sigungu}
            </Text>
          </View>
          <Text style={styles.category}>{post.category}</Text>
          {post.deadline_date ? (
            <Text style={styles.deadline}>마감 {post.deadline_date}</Text>
          ) : null}
        </View>

        <Text style={[styles.title, largeText && styles.titleLarge]}>{post.app_title}</Text>

        {post.has_attachment_only ? (
          <View style={styles.attachmentNotice}>
            <Text style={styles.attachmentNoticeText}>
              본 공고는 지자체 첨부파일(한글/PDF)에 상세 안내가 포함되어 있습니다. 아래 원문·첨부파일 버튼을 눌러 확인해 주세요.
            </Text>
          </View>
        ) : null}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>핵심 요약</Text>
          <Text style={[styles.summaryText, largeText && styles.textLarge]}>
            {post.app_summary_3lines}
          </Text>
        </View>

        <Text style={[styles.detailText, largeText && styles.textLarge]}>
          {post.app_detail_summary}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleOpenSource} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {post.has_attachment_only
                ? '공고 원문·첨부파일 확인 ↗'
                : '공고 원문 / 신청 바로가기 ↗'}
            </Text>
          </TouchableOpacity>

          {post.publish_to_blog ? (
            <TouchableOpacity onPress={handleOpenBlog} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>
                자세히 보기 (생활 꿀팁·체크리스트 포함)
              </Text>
            </TouchableOpacity>
          ) : null}

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
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0'
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
    padding: 20
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
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
  category: {
    fontSize: 13,
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 6
  },
  summaryText: {
    fontSize: 15,
    color: '#202124',
    lineHeight: 23
  },
  detailText: {
    fontSize: 16,
    color: '#3c4043',
    lineHeight: 26,
    marginBottom: 24
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 28
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
