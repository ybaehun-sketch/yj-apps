import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { RECOMMENDED_KEYWORDS } from '../constants/keywords';
import type { AppTheme, SortOrder, UserPreferences, WelfarePost } from '../types/welfare';
import { RegionDropdownSelector } from './RegionDropdownSelector';

interface SettingsDrawerModalProps {
  visible: boolean;
  prefs: UserPreferences;
  favoritePosts?: WelfarePost[];
  onRemoveFavorite?: (postId: string) => void;
  onSelectFavorite?: (post: WelfarePost) => void;
  onClose: () => void;
  onSavePrefs: (next: UserPreferences) => void;
}

type LegalModalType = 'terms' | 'privacy' | 'howto' | null;

const LEGAL_MOCKUP_CONTENT: Record<
  Exclude<LegalModalType, null>,
  { title: string; body: string }
> = {
  terms: {
    title: '이용약관 (목업)',
    body:
      '1. 본 서비스(울동네)는 중앙부처 및 지방자치단체의 공개 공고를 수집·요약하여 안내하는 민간 생활정보 큐레이션 서비스입니다.\n\n' +
      '2. 회원가입이나 본인인증 없이 기기 내 설정만으로 이용할 수 있습니다.\n\n' +
      '3. 공고 내용의 최종 확인 및 신청은 반드시 해당 기관의 공식 안내 페이지에서 진행해 주시기 바랍니다. (정식 출시 시 회사 공식 약관으로 연결됩니다.)'
  },
  privacy: {
    title: '개인정보처리방침 (목업)',
    body:
      '1. 울동네는 별도의 회원가입, 이름, 전화번호, 이메일 등 개인식별정보를 수집하거나 서버에 저장하지 않습니다.\n\n' +
      '2. 선택하신 관심 지역, 키워드, 테마 및 정렬 설정은 모두 사용자 기기 내부에만 안전하게 저장됩니다.\n\n' +
      '3. 알림 수신은 익명 토픽 구독 방식으로 동작하며, 설정 화면에서 언제든 해제할 수 있습니다. (정식 출시 시 회사 공식 개인정보처리방침으로 연결됩니다.)'
  },
  howto: {
    title: '이용방법 (목업)',
    body:
      '1. 슬라이드 설정에서 내 동네(관심 지역)와 관심 키워드를 선택하세요.\n\n' +
      '2. 메인 화면에 내 동네와 전국 공통 혜택이 3~4줄 요약 카드로 자동 정리되어 나타납니다.\n\n' +
      '3. 설정에서 카드 나열 순서(내 지역 우선·최신순·기한 임박순), 노출 개수, 앱 테마를 자유롭게 바꿀 수 있습니다.\n\n' +
      '4. 마음에 드는 카드를 눌러 상세 내용을 보고 [신청하러 가기]로 공식 페이지에 바로 이동하세요.'
  }
};

const MAX_KEYWORDS = 3;

const FRAME_WIDTH =
  Platform.OS === 'web' ? Math.min(Dimensions.get('window').width, 420) : Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(340, FRAME_WIDTH * 0.84);

type AccordionSection = 'favorites' | 'region' | 'keywords' | 'sort' | 'limit' | 'theme';

export function SettingsDrawerModal({
  visible,
  prefs,
  favoritePosts = [],
  onRemoveFavorite,
  onSelectFavorite,
  onClose,
  onSavePrefs
}: SettingsDrawerModalProps) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const [customKeyword, setCustomKeyword] = useState('');
  const [keywordNotice, setKeywordNotice] = useState('');
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [openSection, setOpenSection] = useState<AccordionSection | null>(null);

  const isDark = prefs.theme === 'dark';

  function toggleSection(section: AccordionSection) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(DRAWER_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    }
  }, [visible, slideAnim]);

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web'
    }).start(() => onClose());
  }

  function toggleKeyword(kw: string) {
    const exists = prefs.keywords.includes(kw);
    if (!exists && prefs.keywords.length >= MAX_KEYWORDS) {
      setKeywordNotice(`관심 키워드는 최대 ${MAX_KEYWORDS}개까지 선택할 수 있어요.`);
      return;
    }
    const nextKeywords = exists
      ? prefs.keywords.filter((k) => k !== kw)
      : [...prefs.keywords, kw];
    if (nextKeywords.length === 0) return;
    setKeywordNotice('');
    onSavePrefs({ ...prefs, keywords: nextKeywords });
  }

  function addCustomKeyword() {
    const cleaned = customKeyword.trim().replace(/^#/, '');
    if (!cleaned) return;
    if (!prefs.keywords.includes(cleaned)) {
      if (prefs.keywords.length >= MAX_KEYWORDS) {
        setKeywordNotice(`관심 키워드는 최대 ${MAX_KEYWORDS}개까지 선택할 수 있어요.`);
        return;
      }
      setKeywordNotice('');
      onSavePrefs({ ...prefs, keywords: [...prefs.keywords, cleaned] });
    }
    setCustomKeyword('');
  }

  if (!visible && !legalModal) {
    return null;
  }

  return (
    <>
      {visible ? (
        <View style={styles.overlayRoot}>
          <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouch} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.drawer,
              isDark && styles.drawerDark,
              { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={[styles.drawerHeader, isDark && styles.borderDark]}>
              <Text style={[styles.drawerTitle, isDark && styles.textDark]}>앱 설정</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, isDark && styles.textMutedDark]}>닫기</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerBody}>
              {/* 0. 내 즐겨찾기 목록 */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('favorites')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>
                    내 즐겨찾기
                  </Text>
                  <View style={styles.accordionRight}>
                    <Text style={[styles.accordionSummary, isDark && styles.textMutedDark]}>
                      {favoritePosts.length}/5
                    </Text>
                    <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                      {openSection === 'favorites' ? '▴' : '▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {openSection === 'favorites' ? (
                  <View style={styles.accordionContent}>
                    {favoritePosts.length === 0 ? (
                      <Text style={[styles.favoriteEmptyText, isDark && styles.textMutedDark]}>
                        아직 즐겨찾기한 소식이 없어요.{'\n'}카드 오른쪽 위 ⋮ 버튼에서 최대 5개까지 저장할 수 있어요.
                      </Text>
                    ) : (
                      <View style={styles.favoriteList}>
                        {favoritePosts.map((item) => (
                          <View
                            key={item.id}
                            style={[styles.favoriteItem, isDark && styles.favoriteItemDark]}
                          >
                            <TouchableOpacity
                              onPress={() => onSelectFavorite?.(item)}
                              style={styles.favoriteTitleWrap}
                            >
                              <Text style={[styles.favoriteMeta, isDark && styles.textMutedDark]}>
                                {item.region_code === '00000' ? '전국 공통' : item.region_sigungu} · {item.org_name}
                              </Text>
                              <Text
                                style={[styles.favoriteTitle, isDark && styles.textDark]}
                                numberOfLines={2}
                              >
                                {item.app_title}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => onRemoveFavorite?.(item.id)}
                              style={[styles.favoriteRemoveBtn, isDark && styles.favoriteRemoveBtnDark]}
                            >
                              <Text style={styles.favoriteRemoveText}>해제</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null}
              </View>

              {/* 1. 관심 지역 (시·도 → 시·군·구 2단 드롭다운) */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('region')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>관심 지역</Text>
                  <View style={styles.accordionRight}>
                    <Text style={[styles.accordionSummary, isDark && styles.textMutedDark]}>
                      {prefs.regionSigungu === '전체' ? prefs.regionSido : prefs.regionSigungu}
                    </Text>
                    <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                      {openSection === 'region' ? '▴' : '▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {openSection === 'region' ? (
                  <View style={styles.accordionContent}>
                    <RegionDropdownSelector
                      selectedSido={prefs.regionSido}
                      selectedCode={prefs.regionCode}
                      isDark={isDark}
                      onSelectRegion={(r) =>
                        onSavePrefs({
                          ...prefs,
                          regionSido: r.sido,
                          regionSigungu: r.sigungu,
                          regionCode: r.code
                        })
                      }
                    />
                  </View>
                ) : null}
              </View>

              {/* 2. 관심 키워드 (최대 3개, 중복 없는 6개 예시 키워드) */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('keywords')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>
                    관심 키워드 ({prefs.keywords.length}/{MAX_KEYWORDS})
                  </Text>
                  <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                    {openSection === 'keywords' ? '▴' : '▾'}
                  </Text>
                </TouchableOpacity>
                {openSection === 'keywords' ? (
                  <View style={styles.accordionContent}>
                    {keywordNotice ? (
                      <Text style={styles.limitNotice}>{keywordNotice}</Text>
                    ) : null}
                    <View style={styles.chipWrap}>
                      {Array.from(new Set([...RECOMMENDED_KEYWORDS, ...prefs.keywords])).map((kw) => {
                        const active = prefs.keywords.includes(kw);
                        return (
                          <TouchableOpacity
                            key={kw}
                            onPress={() => toggleKeyword(kw)}
                            style={[
                              styles.chip,
                              isDark && styles.chipDark,
                              active && styles.chipActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                isDark && styles.textMutedDark,
                                active && styles.chipTextActive
                              ]}
                            >
                              #{kw}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.inputRow}>
                      <TextInput
                        value={customKeyword}
                        onChangeText={setCustomKeyword}
                        placeholder="키워드 추가 (예: 창업)"
                        placeholderTextColor={isDark ? '#80868b' : '#9aa0a6'}
                        style={[styles.input, isDark && styles.inputDark]}
                        onSubmitEditing={addCustomKeyword}
                      />
                      <TouchableOpacity onPress={addCustomKeyword} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>추가</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* 3. 카드 나열 순서 */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('sort')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>카드 나열 순서</Text>
                  <View style={styles.accordionRight}>
                    <Text style={[styles.accordionSummary, isDark && styles.textMutedDark]}>
                      {prefs.sortOrder === 'latest'
                        ? '최신순'
                        : prefs.sortOrder === 'deadline'
                          ? '기한 임박순'
                          : '내 지역 우선'}
                    </Text>
                    <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                      {openSection === 'sort' ? '▴' : '▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {openSection === 'sort' ? (
                  <View style={styles.accordionContent}>
                    <View style={styles.chipWrap}>
                      {(
                        [
                          { key: 'region_keyword_first', label: '내 지역 우선' },
                          { key: 'latest', label: '최신순' },
                          { key: 'deadline', label: '기한 임박순' }
                        ] as Array<{ key: SortOrder; label: string }>
                      ).map((item) => {
                        const active =
                          prefs.sortOrder === item.key ||
                          (item.key === 'region_keyword_first' &&
                            ((prefs.sortOrder as string) === 'keyword_first' ||
                              (prefs.sortOrder as string) === 'region_first'));
                        return (
                          <TouchableOpacity
                            key={item.key}
                            onPress={() => onSavePrefs({ ...prefs, sortOrder: item.key })}
                            style={[
                              styles.chip,
                              isDark && styles.chipDark,
                              active && styles.chipActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                isDark && styles.textMutedDark,
                                active && styles.chipTextActive
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>

              {/* 4. 노출될 카드 개수 */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('limit')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>노출될 카드 개수</Text>
                  <View style={styles.accordionRight}>
                    <Text style={[styles.accordionSummary, isDark && styles.textMutedDark]}>
                      {prefs.cardLimit === 20 || prefs.cardLimit === 30 || prefs.cardLimit === 40
                        ? `${prefs.cardLimit}개`
                        : '30개'}
                    </Text>
                    <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                      {openSection === 'limit' ? '▴' : '▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {openSection === 'limit' ? (
                  <View style={styles.accordionContent}>
                    <View style={styles.chipWrap}>
                      {([20, 30, 40] as const).map((cnt) => {
                        const currentLimit =
                          prefs.cardLimit === 20 || prefs.cardLimit === 30 || prefs.cardLimit === 40
                            ? prefs.cardLimit
                            : 30;
                        const active = currentLimit === cnt;
                        return (
                          <TouchableOpacity
                            key={cnt}
                            onPress={() => onSavePrefs({ ...prefs, cardLimit: cnt })}
                            style={[
                              styles.chip,
                              isDark && styles.chipDark,
                              active && styles.chipActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                isDark && styles.textMutedDark,
                                active && styles.chipTextActive
                              ]}
                            >
                              {cnt}개
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>

              {/* 5. 앱 테마 & 보기 옵션 */}
              <View style={[styles.accordionGroup, isDark && styles.borderDark]}>
                <TouchableOpacity
                  onPress={() => toggleSection('theme')}
                  style={styles.accordionHeader}
                >
                  <Text style={[styles.sectionLabel, isDark && styles.textDark]}>앱 설정 및 테마</Text>
                  <View style={styles.accordionRight}>
                    <Text style={[styles.accordionSummary, isDark && styles.textMutedDark]}>
                      {(prefs.theme ?? 'light') === 'dark' ? '다크' : '화이트'}
                    </Text>
                    <Text style={[styles.accordionArrow, isDark && styles.textMutedDark]}>
                      {openSection === 'theme' ? '▴' : '▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {openSection === 'theme' ? (
                  <View style={styles.accordionContent}>
                    <View style={styles.chipWrap}>
                      {(
                        [
                          { key: 'light', label: '밝은 화이트 테마' },
                          { key: 'dark', label: '어두운 다크 테마' }
                        ] as Array<{ key: AppTheme; label: string }>
                      ).map((t) => {
                        const active = (prefs.theme ?? 'light') === t.key;
                        return (
                          <TouchableOpacity
                            key={t.key}
                            onPress={() => onSavePrefs({ ...prefs, theme: t.key })}
                            style={[
                              styles.chip,
                              isDark && styles.chipDark,
                              active && styles.chipActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                isDark && styles.textMutedDark,
                                active && styles.chipTextActive
                              ]}
                            >
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.toggleRow}>
                      <TouchableOpacity
                        onPress={() => onSavePrefs({ ...prefs, largeText: !prefs.largeText })}
                        style={[
                          styles.chip,
                          isDark && styles.chipDark,
                          prefs.largeText && styles.chipActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isDark && styles.textMutedDark,
                            prefs.largeText && styles.chipTextActive
                          ]}
                        >
                          {prefs.largeText ? '☑ 큰 글씨 켜짐' : '☐ 큰 글씨'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => onSavePrefs({ ...prefs, hideExpired: !prefs.hideExpired })}
                        style={[
                          styles.chip,
                          isDark && styles.chipDark,
                          prefs.hideExpired && styles.chipActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isDark && styles.textMutedDark,
                            prefs.hideExpired && styles.chipTextActive
                          ]}
                        >
                          {prefs.hideExpired ? '☑ 마감 공고 숨김' : '☐ 마감 공고 포함'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* 6. 설정칸 하단 목업 안내 (약관·개인정보처리방침·이용방법 모달) */}
              <View style={[styles.legalSection, isDark && styles.borderDark]}>
                <Text style={[styles.legalTitle, isDark && styles.textMutedDark]}>안내 및 정책</Text>
                <View style={styles.legalRow}>
                  <TouchableOpacity
                    onPress={() => setLegalModal('terms')}
                    style={[styles.legalBtn, isDark && styles.chipDark]}
                  >
                    <Text style={[styles.legalBtnText, isDark && styles.textDark]}>이용약관</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLegalModal('privacy')}
                    style={[styles.legalBtn, isDark && styles.chipDark]}
                  >
                    <Text style={[styles.legalBtnText, isDark && styles.textDark]}>
                      개인정보처리방침
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLegalModal('howto')}
                    style={[styles.legalBtn, isDark && styles.chipDark]}
                  >
                    <Text style={[styles.legalBtnText, isDark && styles.textDark]}>이용방법</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
          </View>
        </View>
      ) : null}

      {/* 약관·개인정보처리방침·이용방법 목업 모달 */}
      {legalModal !== null ? (
        <View style={styles.legalOverlayRoot}>
          <View style={styles.legalModalBackdrop}>
            <View style={[styles.legalModalCard, isDark && styles.drawerDark]}>
              <Text style={[styles.legalModalTitle, isDark && styles.textDark]}>
                {LEGAL_MOCKUP_CONTENT[legalModal].title}
              </Text>
              <ScrollView style={styles.legalModalScroll}>
                <Text style={[styles.legalModalBody, isDark && styles.textMutedDark]}>
                  {LEGAL_MOCKUP_CONTENT[legalModal].body}
                </Text>
              </ScrollView>
              <TouchableOpacity
                onPress={() => setLegalModal(null)}
                style={styles.legalModalCloseBtn}
              >
                <Text style={styles.legalModalCloseText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100
  },
  legalOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120
  },
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.42)'
  },
  backdropTouch: {
    flex: 1
  },
  drawer: {
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10
  },
  drawerDark: {
    backgroundColor: '#161920'
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0'
  },
  borderDark: {
    borderColor: '#2d323e'
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124'
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368'
  },
  drawerBody: {
    padding: 18,
    paddingBottom: 36
  },
  accordionGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    paddingVertical: 6
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  accordionSummary: {
    fontSize: 13,
    color: '#5f6368',
    fontWeight: '500'
  },
  accordionArrow: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '700'
  },
  accordionContent: {
    paddingBottom: 10
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124'
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  chipDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  chipActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe'
  },
  chipText: {
    fontSize: 13,
    color: '#3c4043'
  },
  chipTextActive: {
    color: '#1a73e8',
    fontWeight: '700'
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#202124'
  },
  inputDark: {
    borderColor: '#323844',
    backgroundColor: '#1e222a',
    color: '#f1f3f4'
  },
  addBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  legalSection: {
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#dadce0'
  },
  legalTitle: {
    fontSize: 12,
    color: '#5f6368',
    marginBottom: 10
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  legalBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  legalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c4043'
  },
  legalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  legalModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20
  },
  legalModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 12
  },
  legalModalScroll: {
    marginBottom: 16
  },
  legalModalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3c4043'
  },
  legalModalCloseBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  legalModalCloseText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  },
  limitNotice: {
    fontSize: 12,
    color: '#d93025',
    marginBottom: 8
  },
  favoriteEmptyText: {
    fontSize: 13,
    color: '#5f6368',
    lineHeight: 20
  },
  favoriteList: {
    gap: 8
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e3e7ed',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  favoriteItemDark: {
    backgroundColor: '#1e2430',
    borderColor: '#323a4a'
  },
  favoriteTitleWrap: {
    flex: 1
  },
  favoriteMeta: {
    fontSize: 11,
    color: '#5f6368',
    marginBottom: 2
  },
  favoriteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
    lineHeight: 18
  },
  favoriteRemoveBtn: {
    backgroundColor: '#fce8e6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  favoriteRemoveBtnDark: {
    backgroundColor: '#3d2224'
  },
  favoriteRemoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c5221f'
  }
});
