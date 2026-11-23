import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '../types/welfare';

const PREFS_KEY = 'uldongne_user_prefs_v1';
const LAST_INTERSTITIAL_KEY = 'uldongne_last_interstitial_time';

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
