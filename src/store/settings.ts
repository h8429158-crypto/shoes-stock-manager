import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'stockroom.themeMode';

interface SettingsState {
  themeMode: ThemeMode;
  loadSettings: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'system',
  loadSettings: async () => {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ themeMode: stored });
    }
  },
  setThemeMode: (themeMode) => {
    set({ themeMode });
    AsyncStorage.setItem(THEME_KEY, themeMode).catch(() => {});
  },
}));
