import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SIDO_GROUPS, type RegionOption } from '../constants/regions';

interface RegionDropdownSelectorProps {
  selectedSido: string;
  selectedCode: string;
  isDark?: boolean;
  onSelectRegion: (region: RegionOption) => void;
}

export function RegionDropdownSelector({
  selectedSido,
  selectedCode,
  isDark = false,
  onSelectRegion
}: RegionDropdownSelectorProps) {
  const [openMenu, setOpenMenu] = useState<'sido' | 'sigungu' | null>(null);

  const currentGroup =
    SIDO_GROUPS.find((g) => g.sido === selectedSido) ??
    SIDO_GROUPS.find((g) => g.items.some((i) => i.code === selectedCode)) ??
    SIDO_GROUPS[1];

  const currentSigunguItem =
    currentGroup.items.find((i) => i.code === selectedCode) ?? currentGroup.items[0];

  function handleSelectSido(sido: string) {
    const targetGroup = SIDO_GROUPS.find((g) => g.sido === sido);
    if (!targetGroup || targetGroup.items.length === 0) return;
    const firstItem = targetGroup.items[0];
    onSelectRegion({
      sido: targetGroup.sido,
      sigungu: firstItem.sigungu,
      code: firstItem.code
    });
    setOpenMenu(targetGroup.items.length > 1 ? 'sigungu' : null);
  }

  function handleSelectSigungu(item: { sigungu: string; code: string }) {
    onSelectRegion({
      sido: currentGroup.sido,
      sigungu: item.sigungu,
      code: item.code
    });
    setOpenMenu(null);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* 1단계: 시/도 드롭다운 */}
        <View style={styles.col}>
          <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>시 · 도</Text>
          <TouchableOpacity
            onPress={() => setOpenMenu((prev) => (prev === 'sido' ? null : 'sido'))}
            style={[
              styles.trigger,
              isDark && styles.triggerDark,
              openMenu === 'sido' && styles.triggerOpen
            ]}
          >
            <Text style={[styles.triggerText, isDark && styles.textDark]} numberOfLines={1}>
              {currentGroup.sido}
            </Text>
            <Text style={[styles.arrow, isDark && styles.textMutedDark]}>
              {openMenu === 'sido' ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2단계: 시/군/구 드롭다운 */}
        <View style={styles.col}>
          <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>시 · 군 · 구</Text>
          <TouchableOpacity
            onPress={() => setOpenMenu((prev) => (prev === 'sigungu' ? null : 'sigungu'))}
            style={[
              styles.trigger,
              isDark && styles.triggerDark,
              openMenu === 'sigungu' && styles.triggerOpen
            ]}
          >
            <Text style={[styles.triggerText, isDark && styles.textDark]} numberOfLines={1}>
              {currentSigunguItem.sigungu}
            </Text>
            <Text style={[styles.arrow, isDark && styles.textMutedDark]}>
              {openMenu === 'sigungu' ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 펼쳐지는 드롭다운 목록 */}
      {openMenu === 'sido' ? (
        <View style={[styles.dropdownListWrap, isDark && styles.dropdownListWrapDark]}>
          <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
            {SIDO_GROUPS.map((group) => {
              const active = group.sido === currentGroup.sido;
              return (
                <TouchableOpacity
                  key={group.sido}
                  onPress={() => handleSelectSido(group.sido)}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      isDark && styles.textDark,
                      active && styles.dropdownItemTextActive
                    ]}
                  >
                    {group.sido}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {openMenu === 'sigungu' ? (
        <View style={[styles.dropdownListWrap, isDark && styles.dropdownListWrapDark]}>
          <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
            {currentGroup.items.map((item) => {
              const active = item.code === currentSigunguItem.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => handleSelectSigungu(item)}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      isDark && styles.textDark,
                      active && styles.dropdownItemTextActive
                    ]}
                  >
                    {item.sigungu}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 2
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  col: {
    flex: 1
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 4
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  triggerDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  triggerOpen: {
    borderColor: '#1a73e8'
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
    marginRight: 4
  },
  arrow: {
    fontSize: 10,
    color: '#5f6368'
  },
  dropdownListWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    maxHeight: 190,
    overflow: 'hidden'
  },
  dropdownListWrapDark: {
    backgroundColor: '#1e222a',
    borderColor: '#323844'
  },
  dropdownScroll: {
    maxHeight: 190
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4'
  },
  dropdownItemActive: {
    backgroundColor: '#e8f0fe'
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#202124'
  },
  dropdownItemTextActive: {
    color: '#1a73e8',
    fontWeight: '700'
  },
  textDark: {
    color: '#f1f3f4'
  },
  textMutedDark: {
    color: '#9aa0a6'
  }
});
