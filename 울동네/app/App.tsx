import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DetailScreen } from './src/screens/DetailScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { syncFcmTopicSubscriptions } from './src/services/fcmService';
import { loadUserPreferences, saveUserPreferences } from './src/services/storageService';
import type { UserPreferences, WelfarePost } from './src/types/welfare';

export default function App() {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [selectedPost, setSelectedPost] = useState<WelfarePost | null>(null);

  useEffect(() => {
    loadUserPreferences().then((saved) => {
      setPrefs(saved);
      setReady(true);
    });
  }, []);

  async function handleSavePrefs(next: UserPreferences) {
    setPrefs(next);
    setEditingOnboarding(false);
    await saveUserPreferences(next);
    await syncFcmTopicSubscriptions(next.regionCode, next.keywords);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        {!ready ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1a73e8" />
          </View>
        ) : !prefs || editingOnboarding ? (
          <OnboardingScreen initialPrefs={prefs} onComplete={handleSavePrefs} />
        ) : selectedPost ? (
          <DetailScreen
            post={selectedPost}
            largeText={prefs.largeText}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
