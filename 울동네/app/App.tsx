import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DetailScreen } from './src/screens/DetailScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import {
  registerNotificationTapHandler,
  syncFcmTopicSubscriptions
} from './src/services/fcmService';
import { initializeInterstitialAd } from './src/services/adService';
import { loadUserPreferences, saveUserPreferences } from './src/services/storageService';
import { fetchPostByNotificationPayload } from './src/services/supabaseService';
import type { UserPreferences, WelfarePost } from './src/types/welfare';

export default function App() {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [selectedPost, setSelectedPost] = useState<WelfarePost | null>(null);

  useEffect(() => {
    initializeInterstitialAd();
    loadUserPreferences().then((saved) => {
      if (saved) {
        const normalized: UserPreferences = {
          ...saved,
          cardLimit: saved.cardLimit ?? 40,
          theme: saved.theme ?? 'light',
          notificationsEnabled: saved.notificationsEnabled ?? true
        };
        setPrefs(normalized);
        void syncFcmTopicSubscriptions(
          normalized.regionCode,
          normalized.keywords,
          normalized.notificationsEnabled
        );
      } else {
        setPrefs(null);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    return registerNotificationTapHandler((payload) => {
      void fetchPostByNotificationPayload(payload).then((post) => {
        if (post) {
          setSelectedPost(post);
        }
      });
    });
  }, []);

  async function handleSavePrefs(next: UserPreferences) {
    const normalized: UserPreferences = {
      ...next,
      notificationsEnabled: next.notificationsEnabled ?? true
    };
    setPrefs(normalized);
    setEditingOnboarding(false);
    await saveUserPreferences(normalized);
    await syncFcmTopicSubscriptions(
      normalized.regionCode,
      normalized.keywords,
      normalized.notificationsEnabled
    );
  }

  const isDark = prefs?.theme === 'dark';

  const appContent = (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : !prefs || editingOnboarding ? (
        <OnboardingScreen initialPrefs={prefs} onComplete={handleSavePrefs} />
      ) : selectedPost ? (
        <DetailScreen
          post={selectedPost}
          userKeywords={prefs.keywords}
          largeText={prefs.largeText}
          isDark={isDark}
          onBack={() => setSelectedPost(null)}
        />
      ) : (
        <FeedScreen
          prefs={prefs}
          onUpdatePrefs={handleSavePrefs}
          onOpenSettings={() => setEditingOnboarding(true)}
          onSelectPost={(post) => setSelectedPost(post)}
        />
      )}
    </SafeAreaView>
  );

  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? (
        <View style={styles.webBackdrop}>
          <View style={[styles.phoneFrame, isDark && styles.phoneFrameDark]}>
            {appContent}
          </View>
        </View>
      ) : (
        appContent
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    backgroundColor: '#e8edf4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    maxHeight: 860,
    backgroundColor: '#eff2f6',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#cfd8e3',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10
  },
  phoneFrameDark: {
    backgroundColor: '#12151b',
    borderColor: '#2d3544'
  },
  safe: {
    flex: 1,
    backgroundColor: '#eff2f6'
  },
  safeDark: {
    backgroundColor: '#12151b'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
