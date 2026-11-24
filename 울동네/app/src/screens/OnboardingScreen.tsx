import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { RegionDropdownSelector } from '../components/RegionDropdownSelector';
import { RECOMMENDED_KEYWORDS, STANDARD_CATEGORIES } from '../constants/keywords';
import { REGION_OPTIONS, type RegionOption } from '../constants/regions';
import type { UserPreferences } from '../types/welfare';

interface OnboardingScreenProps {
  initialPrefs?: UserPreferences | null;
  onComplete: (prefs: UserPreferences) => void;
}

const MAX_KEYWORDS = 3;

export function OnboardingScreen({ initialPrefs, onComplete }: OnboardingScreenProps) {
  const defaultRegion =
    REGION_OPTIONS.find((r) => r.code === initialPrefs?.regionCode) ??
    REGION_OPTIONS.find((r) => r.code === '51720') ??
    REGION_OPTIONS[0];

  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(defaultRegion);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    (initialPrefs?.keywords ?? ['방학돌봄', '난방비']).slice(0, MAX_KEYWORDS)
  );
  const [customInput, setCustomInput] = useState('');
  const [keywordNotice, setKeywordNotice] = useState('');

  function toggleKeyword(kw: string) {
    const exists = selectedKeywords.includes(kw);
    if (!exists && selectedKeywords.length >= MAX_KEYWORDS) {
      setKeywordNotice(`관심 키워드는 최대 ${MAX_KEYWORDS}개까지 선택할 수 있어요.`);
      return;
    }
    setKeywordNotice('');
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((item) => item !== kw) : [...prev, kw]
    );
  }

  function handleAddCustomKeyword() {
    const clean = customInput.replace(/^#/, '').trim();
    if (!clean) return;
    if (!selectedKeywords.includes(clean)) {
      if (selectedKeywords.length >= MAX_KEYWORDS) {
        setKeywordNotice(`관심 키워드는 최대 ${MAX_KEYWORDS}개까지 선택할 수 있어요.`);
        return;
      }
      setKeywordNotice('');
      setSelectedKeywords((prev) => [...prev, clean]);
    }
    setCustomInput('');
  }

  function handleSubmit() {
    onComplete({
      regionSido: selectedRegion.sido,
      regionSigungu: selectedRegion.sigungu,
      regionCode: selectedRegion.code,
      keywords: selectedKeywords.length > 0 ? selectedKeywords : ['생활/문화'],
      sortOrder: initialPrefs?.sortOrder ?? 'region_keyword_first',
      hideExpired: initialPrefs?.hideExpired ?? true,
      largeText: initialPrefs?.largeText ?? true,
      cardLimit: initialPrefs?.cardLimit === 20 || initialPrefs?.cardLimit === 30 || initialPrefs?.cardLimit === 40 ? initialPrefs.cardLimit : 30,
      theme: initialPrefs?.theme ?? 'light'
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoBadge}>울동네</Text>
        <Text style={styles.heading}>회원가입 없이 10초 만에 시작해요</Text>
        <Text style={styles.subheading}>
          우리 동네와 관심 분야만 고르면 지원금·돌봄 공고를 바로 모아드립니다.
        </Text>
      </View>

      {/* 1단계: 지역 선택 (시·도 → 시·군·구 2단 드롭다운) */}
      <View style={styles.section}>
        <Text style={styles.stepTitle}>1단계. 내 동네 선택</Text>
        <RegionDropdownSelector
          selectedSido={selectedRegion.sido}
          selectedCode={selectedRegion.code}
          onSelectRegion={(region) => setSelectedRegion(region)}
        />
      </View>

      {/* 2단계: 표준 관심 분야 + 추천 키워드 (최대 3개) */}
      <View style={styles.section}>
        <Text style={styles.stepTitle}>
          2단계. 관심 분야 및 키워드 선택 ({selectedKeywords.length}/{MAX_KEYWORDS})
        </Text>
        <Text style={styles.helperText}>
          최대 3개까지 고르시면 비슷한 단어 공고까지 함께 챙겨드려요.
        </Text>
        {keywordNotice ? <Text style={styles.limitNotice}>{keywordNotice}</Text> : null}

        <View style={styles.chipWrap}>
          {[...STANDARD_CATEGORIES, ...RECOMMENDED_KEYWORDS].map((kw) => {
            const active = selectedKeywords.includes(kw);
            return (
              <TouchableOpacity
                key={kw}
                onPress={() => toggleKeyword(kw)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  #{kw}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="직접 입력 (예: 산후조리, 장학금)"
            style={styles.input}
            onSubmitEditing={handleAddCustomKeyword}
          />
          <TouchableOpacity onPress={handleAddCustomKeyword} style={styles.addBtn}>
            <Text style={styles.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleSubmit} style={styles.startBtn}>
        <Text style={styles.startBtnText}>
          {selectedRegion.sigungu} 소식 바로 보기
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#eff2f6',
    flexGrow: 1
  },
  header: {
    marginTop: 12,
    marginBottom: 28
  },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a73e8',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202124',
    lineHeight: 32
  },
  subheading: {
    marginTop: 8,
    fontSize: 15,
    color: '#5f6368',
    lineHeight: 22
  },
  section: {
    marginBottom: 28
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 10
  },
  helperText: {
    fontSize: 13,
    color: '#5f6368',
    marginBottom: 12,
    lineHeight: 19
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
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  chipActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe'
  },
  chipText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#1a73e8'
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#202124'
  },
  addBtn: {
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124'
  },
  startBtn: {
    marginTop: 'auto',
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  limitNotice: {
    fontSize: 12,
    color: '#d93025',
    marginBottom: 8
  }
});
