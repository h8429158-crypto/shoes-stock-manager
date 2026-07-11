import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { refetchAll, setupRealtime } from '@/db/sync';
import { useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';
import { useSyncStore } from '@/store/sync';

import type { ColorValue } from 'react-native';

function TabIcon({ name, color }: { name: keyof typeof MaterialCommunityIcons.glyphMap; color: ColorValue }) {
  return <MaterialCommunityIcons name={name} size={24} color={color as string} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const { session, activeOrgId, initialized } = useAuthStore();
  const hydrateFromCache = useDataStore((s) => s.hydrateFromCache);
  const online = useSyncStore((s) => s.online);

  // Bootstrap org data: instant hydrate from SQLite, then refresh + realtime.
  useEffect(() => {
    if (!activeOrgId || !session) return;
    hydrateFromCache(activeOrgId);
    if (online) void refetchAll(activeOrgId);
    void setupRealtime(activeOrgId, session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId, session?.user.id]);

  if (initialized && !session) return <Redirect href="/(auth)/login" />;
  if (initialized && session && !activeOrgId) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="view-dashboard-outline" color={color} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: ({ color }) => <TabIcon name="shoe-sneaker" color={color} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={[styles.scanFab, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="barcode-scan" size={26} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: ({ color }) => <TabIcon name="clipboard-text-outline" color={color} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color }) => <TabIcon name="dots-horizontal" color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
