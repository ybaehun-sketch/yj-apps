import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences, WelfarePost } from '../types/welfare';

const PREFS_KEY = 'uldongne_user_prefs_v1';
const LAST_INTERSTITIAL_KEY = 'uldongne_last_interstitial_time';
const FAVORITE_POSTS_KEY = 'uldongne_favorite_posts_v1';
const HIDDEN_POST_IDS_KEY = 'uldongne_hidden_post_ids_v1';

export async function loadUserPreferences(): Promise<UserPreferences | null> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return null;
  }
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function getLastInterstitialTime(): Promise<number> {
  const raw = await AsyncStorage.getItem(LAST_INTERSTITIAL_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setLastInterstitialTime(timestampMs: number): Promise<void> {
  await AsyncStorage.setItem(LAST_INTERSTITIAL_KEY, String(timestampMs));
}

export async function loadFavoritePosts(): Promise<WelfarePost[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WelfarePost[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavoritePosts(posts: WelfarePost[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITE_POSTS_KEY, JSON.stringify(posts));
}

export async function loadHiddenPostIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_POST_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveHiddenPostIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(HIDDEN_POST_IDS_KEY, JSON.stringify(ids));
}
