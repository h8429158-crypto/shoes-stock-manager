import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from '@/navigation/RootNavigator';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';
import { configureNotifications } from '@/utils/notifications';

configureNotifications();

export default function App() {
  const t = useTheme();
  const hydrated = useStore((s) => s._hasHydrated);
  const seedIfEmpty = useStore((s) => s.seedIfEmpty);

  // Seed sample data once persisted state has rehydrated.
  useEffect(() => {
    if (hydrated) seedIfEmpty();
  }, [hydrated, seedIfEmpty]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaProvider>
        <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
        {hydrated ? <RootNavigator /> : <View style={{ flex: 1, backgroundColor: t.bg }} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
