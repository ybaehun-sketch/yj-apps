import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { NativeAdCard } from '../components/NativeAdCard';
import { getDdayLabel, WelfareCard } from '../components/WelfareCard';
import { expandKeywordsWithSynonyms } from '../constants/keywords';
import { fetchFeedPosts } from '../services/supabaseService';
import type { SortOrder, UserPreferences, WelfarePost } from '../types/welfare';

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
  onOpenSettings,
  onSelectPost
}: FeedScreenProps) {
  const [posts, setPosts] = useState<WelfarePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPosts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchFeedPosts(prefs.regionCode);
      setPosts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [prefs.regionCode]);

  const expandedUserKeywords = useMemo(
    () => expandKeywordsWithSynonyms(prefs.keywords),
    [prefs.keywords]
  );

  const feedRows = useMemo<FeedRow[]>(() => {
    const checkMatch = (post: WelfarePost) => {
      const targetText = [post.category, post.app_title, ...(post.keywords || [])]
        .join(' ')
        .toLowerCase();
      return expandedUserKeywords.some((kw) => targetText.includes(kw.toLowerCase()));
    };

    const filtered = posts.filter((post) => {
      if (!prefs.hideExpired) return true;
      const dday = getDdayLabel(post.deadline_date);
      return !dday?.isExpired;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (prefs.sortOrder === 'keyword_first') {
        const ma = checkMatch(a) ? 1 : 0;
        const mb = checkMatch(b) ? 1 : 0;
        if (ma !== mb) return mb - ma;
      }
      if (prefs.sortOrder === 'deadline') {
        const da = a.deadline_date ? new Date(a.deadline_date).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.deadline_date ? new Date(b.deadline_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (da !== db) return da - db;
      }
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    });

    // 소식 카드 3개당 1개 비율로 네이티브 광고 삽입
    const rows: FeedRow[] = [];
    sorted.forEach((post, idx) => {
      rows.push({ type: 'post', post, isMatch: checkMatch(post) });
      if ((idx + 1) % 3 === 0) {
        rows.push({ type: 'ad', key: `ad-${idx}` });
      }
    });
    return rows;
  }, [posts, prefs.hideExpired, prefs.sortOrder, expandedUserKeywords]);

  function setSortOrder(order: SortOrder) {
    onUpdatePrefs({ ...prefs, sortOrder: order });
  }

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onOpenSettings} style={styles.regionBtn}>
          <Text style={styles.regionBtnText}>{prefs.regionSigungu} ▾</Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => onUpdatePrefs({ ...prefs, largeText: !prefs.largeText })}
            style={[styles.iconBtn, prefs.largeText && styles.iconBtnActive]}
          >
            <Text style={[styles.iconBtnText, prefs.largeText && styles.iconBtnTextActive]}>
              가+
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>관심 키워드</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 정렬 및 마감 숨김 바 */}
      <View style={styles.sortBar}>
        <View style={styles.sortPills}>
          {(
            [
              { key: 'keyword_first', label: '관심순' },
              { key: 'deadline', label: '마감임박순' },
              { key: 'latest', label: '최신순' }
            ] as Array<{ key: SortOrder; label: string }>
          ).map((item) => {
            const active = prefs.sortOrder === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSortOrder(item.key)}
                style={[styles.sortPill, active && styles.sortPillActive]}
              >
                <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => onUpdatePrefs({ ...prefs, hideExpired: !prefs.hideExpired })}
        >
          <Text style={styles.hideExpiredText}>
            {prefs.hideExpired ? '☑ 마감 숨김' : '☐ 마감 포함'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={feedRows}
          keyExtractor={(item) => (item.type === 'post' ? item.post.id : item.key)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} />
          }
          renderItem={({ item }) =>
            item.type === 'ad' ? (
              <NativeAdCard largeText={prefs.largeText} />
            ) : (
              <WelfareCard
                post={item.post}
                isKeywordMatch={item.isMatch}
                largeText={prefs.largeText}
                onPress={() => onSelectPost(item.post)}
              />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>표시할 공고가 없습니다.</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.disclaimerFooter}>
              <Text style={styles.disclaimerText}>
                본 앱은 정부·지자체 공식 앱이 아닌 민간 생활정보 큐레이션 서비스이며, 최종 확인과 신청은 공식 출처에서 진행하셔야 합니다.
              </Text>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://yjstudio.app/privacy')}>
                  <Text style={styles.legalLinkText}>개인정보처리방침</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://yjstudio.app/terms')}>
                  <Text style={styles.legalLinkText}>이용약관</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0'
  },
  regionBtn: {
    paddingVertical: 4
  },
  regionBtnText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#202124'
  },
  topActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  iconBtnActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe'
  },
  iconBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124'
  },
  iconBtnTextActive: {
    color: '#1a73e8'
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4'
  },
  sortPills: {
    flexDirection: 'row',
    gap: 6
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f3f4'
  },
  sortPillActive: {
    backgroundColor: '#1a73e8'
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368'
  },
  sortPillTextActive: {
    color: '#ffffff'
  },
  hideExpiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368'
  },
  listContent: {
    padding: 16
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 15,
    color: '#5f6368'
  },
  disclaimerFooter: {
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#dadce0',
    backgroundColor: '#f8f9fa',
    borderRadius: 10
  },
  disclaimerText: {
    fontSize: 12,
    color: '#5f6368',
    lineHeight: 18
  },
  legalLinks: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10
  },
  legalLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a73e8'
  }
});
