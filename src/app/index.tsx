import { Redirect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useAuthStore } from '@/store/auth';

/** Entry gate: route to auth, onboarding, or the app based on session state. */
export default function Index() {
  const { initialized, session, orgsLoaded, orgs } = useAuthStore();

  if (!initialized || (session && !orgsLoaded)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (orgs.length === 0) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
