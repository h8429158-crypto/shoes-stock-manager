import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from '@/db/database';
import { startSyncEngine } from '@/db/sync';
import { darkTheme, lightTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    initDb();
    startSyncEngine();
    void loadSettings();
    void init();
  }, [init, loadSettings]);

  const dark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const theme = dark ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/new" options={{ title: 'New product', presentation: 'modal' }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
            <Stack.Screen name="product/edit/[id]" options={{ title: 'Edit product', presentation: 'modal' }} />
            <Stack.Screen name="stock-op" options={{ title: 'Stock operation', presentation: 'modal' }} />
            <Stack.Screen name="stocktake" options={{ title: 'Stocktake' }} />
            <Stack.Screen name="po/new" options={{ title: 'New purchase order', presentation: 'modal' }} />
            <Stack.Screen name="po/[id]" options={{ title: 'Purchase order' }} />
            <Stack.Screen name="invoice/new" options={{ title: 'New invoice', presentation: 'modal' }} />
            <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
            <Stack.Screen name="alerts" options={{ title: 'Alerts' }} />
            <Stack.Screen name="team" options={{ title: 'Team' }} />
            <Stack.Screen name="categories" options={{ title: 'Categories' }} />
            <Stack.Screen name="suppliers" options={{ title: 'Suppliers' }} />
            <Stack.Screen name="reports" options={{ title: 'Reports' }} />
            <Stack.Screen name="org-settings" options={{ title: 'Organization settings' }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
