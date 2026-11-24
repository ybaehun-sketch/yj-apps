import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { NativeAdCard } from '../components/NativeAdCard';
import { SettingsDrawerModal } from '../components/SettingsDrawerModal';
import { getDdayLabel, WelfareCard } from '../components/WelfareCard';
import { expandKeywordsWithSynonyms } from '../constants/keywords';
import { fetchFeedPosts } from '../services/supabaseService';
import type { UserPreferences, WelfarePost } from '../types/welfare';

interface FeedScreenProps {
  prefs: UserPreferences;
  onUpdatePrefs: (next: UserPreferences) => void;
  onOpenSettings: () => void;
  onSelectPost: (post: WelfarePost) => void;
}

type FeedRow =
  | { type: 'post'; post: WelfarePost; isMatch: boolean }
  | { type: 'ad'; key: string };

export function FeedScreen({
  prefs,
  onUpdatePrefs,
  onSelectPost
}: FeedScreenProps) {
  const [posts, setPosts] = useState<WelfarePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollOffsetY = useRef(0);

  const isDark = prefs.theme === 'dark';
  const cardLimit = prefs.cardLimit ?? 40;
  const keywordsKey = prefs.keywords.join(',');

  async function loadPosts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchFeedPosts(prefs.regionCode, cardLimit);
      setPosts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
    }
  }

  useEffect(() => {
    loadPosts(posts.length > 0);
  }, [prefs.regionCode, cardLimit, keywordsKey]);

  const webPullResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Platform.OS === 'web' &&
          !refreshing &&
          scrollOffsetY.current <= 4 &&
          gesture.dy > 10 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) {
            setPullDistance(Math.min(84, gesture.dy));
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy >= 52 && !refreshing) {
            loadPosts(true);
          } else {
            setPullDistance(0);
          }
        },
        onPanResponderTerminate: () => {
          setPullDistance(0);
        }
      }),
    [refreshing, prefs.regionCode, cardLimit]
  );

  const expandedUserKeywords = useMemo(
    () => expandKeywordsWithSynonyms(prefs.keywords),
    [prefs.keywords]
  );

  const feedRows = useMemo<FeedRow[]>(() => {
    const withMatch = posts
      .filter((post) => {
        if (!prefs.hideExpired) return true;
        const dday = getDdayLabel(post.deadline_date);
        return !dday?.isExpired;
      })
      .map((post) => {
        const postTerms = [
          post.category,
          ...(post.keywords || []),
          post.app_title
        ].map((t) => t.toLowerCase());

        const isMatch = expandedUserKeywords.some((uk) =>
          postTerms.some((pt) => pt.includes(uk.toLowerCase()) || uk.toLowerCase().includes(pt))
        );
        return { post, isMatch };
      });

    const sorted = [...withMatch].sort((a, b) => {
      if (prefs.sortOrder === 'keyword_first') {
        if (a.isMatch !== b.isMatch) return a.isMatch ? -1 : 1;
      }
      if (prefs.sortOrder === 'deadline') {
        const da = a.post.deadline_date ? new Date(a.post.deadline_date).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.post.deadline_date ? new Date(b.post.deadline_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (da !== db) return da - db;
      }
      const pa = a.post.published_at ? new Date(a.post.published_at).getTime() : 0;
      const pb = b.post.published_at ? new Date(b.post.published_at).getTime() : 0;
      return pb - pa;
    });

    const limited = sorted.slice(0, cardLimit);

    // 심사 전 앱 형태 구성용 목업 AD 카드를 3개당 1개 비율로 자연스럽게 배치
    const rows: FeedRow[] = [];
    limited.forEach((item, index) => {
      rows.push({ type: 'post', post: item.post, isMatch: item.isMatch });
      if ((index + 1) % 3 === 0) {
        rows.push({ type: 'ad', key: `ad-${index}` });
      }
    });
    return rows;
  }, [posts, prefs.hideExpired, prefs.sortOrder, expandedUserKeywords, cardLimit]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* 심플 상단 바: 앱 이름 + 설정 버튼 */}
      <View style={[styles.topBar, isDark && styles.topBarDark]}>
        <View style={styles.brandWrap}>
          <Text style={[styles.appTitle, isDark && styles.textDark]}>울동네</Text>
          <Text style={[styles.regionTag, isDark && styles.regionTagDark]}>
            {prefs.regionSigungu}
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => loadPosts(true)}
            disabled={refreshing}
            style={[styles.settingsBtn, isDark && styles.settingsBtnDark]}
          >
            <Text style={[styles.settingsBtnText, isDark && styles.textDark]}>
              {refreshing ? '갱신중' : '↻'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={[styles.settingsBtn, isDark && styles.settingsBtnDark]}
          >
            <Text style={[styles.settingsBtnText, isDark && styles.textDark]}>설정</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <View
          style={styles.feedWrap}
          {...(Platform.OS === 'web' ? webPullResponder.panHandlers : {})}
        >
          {(pullDistance > 12 || refreshing) ? (
            <View style={[styles.pullBanner, isDark && styles.pullBannerDark]}>
              <Text style={[styles.pullBannerText, isDark && styles.textMutedDark]}>
                {refreshing
                  ? '새 키워드와 최신 공고를 불러오는 중...'
                  : pullDistance >= 52
                    ? '↻ 놓으면 새로고침됩니다'
                    : '↓ 아래로 더 당겨서 새로고침'}
              </Text>
            </View>
          ) : null}
          <FlatList
            data={feedRows}
            keyExtractor={(item) => (item.type === 'post' ? item.post.id : item.key)}
            contentContainerStyle={styles.listContent}
            onScroll={(e) => {
              scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} />
            }
            renderItem={({ item }) =>
              item.type === 'ad' ? (
                <NativeAdCard largeText={prefs.largeText} isDark={isDark} />
              ) : (
                <WelfareCard
                  post={item.post}
                  isKeywordMatch={item.isMatch}
                  largeText={prefs.largeText}
                  isDark={isDark}
                  onPress={() => onSelectPost(item.post)}
                />
              )
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  표시할 공고가 없습니다.
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* 앱 하단 고정 면책 문구 */}
      <View style={[styles.bottomNotice, isDark && styles.bottomNoticeDark]}>
        <Text style={[styles.bottomNoticeText, isDark && styles.textMutedDark]}>
          본 앱은 정부·지자체 공식 사이트가 아닌 민간 생활정보 큐레이션 서비스입니다.
        </Text>
      </View>

      {/* 슬라이드 설정창 + 하단 약관/개인정보처리방침/이용방법 모달 */}
      <SettingsDrawerModal
        visible={drawerOpen}
        prefs={prefs}
        onClose={() => setDrawerOpen(false)}
        onSavePrefs={onUpdatePrefs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  containerDark: {
    backgroundColor: '#12151b'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0'
  },
  topBarDark: {
    borderBottomColor: '#2d323e'
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202124'
  },
  regionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  regionTagDark: {
    backgroundColor: '#1e2b42',
    color: '#8ab4f8'
  },
  settingsBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  settingsBtnDark: {
    borderColor: '#323844',
    backgroundColor: '#1e222a'
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202124'
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  feedWrap: {
    flex: 1
  },
  pullBanner: {
    backgroundColor: '#f8fbff',
    borderBottomWidth: 1,
    borderBottomColor: '#d2e3fc',
    paddingVertical: 8,
    alignItems: 'center'
  },
  pullBannerDark: {
    backgroundColor: '#1a2230',
    borderBottomColor: '#2d3544'
  },
  pullBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a73e8'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 16,
    paddingBottom: 24
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 15,
    color: '#5f6368'
  },
  bottomNotice: {
    borderTopWidth: 1,
    borderTopColor: '#eceff1',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center'
  },
  bottomNoticeDark: {
    borderTopColor: '#2d323e',
    backgroundColor: '#161920'
  },
  bottomNoticeText: {
    fontSize: 11,
    color: '#5f6368',
    textAlign: 'center'
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  }
});
