import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Divider, List, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/offline-banner';
import { can } from '@/lib/types';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';
import { useSettingsStore, type ThemeMode } from '@/store/settings';
import { useSyncStore } from '@/store/sync';

export default function MoreScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const role = useActiveRole();
  const { session, signOut } = useAuthStore();
  const profiles = useDataStore((s) => s.profiles);
  const { themeMode, setThemeMode } = useSettingsStore();
  const { pendingCount, lastSyncAt } = useSyncStore();

  const myName = session ? (profiles[session.user.id]?.full_name ?? session.user.email) : '';

  const confirmSignOut = () => {
    Alert.alert(
      'Log out',
      pendingCount > 0
        ? `You have ${pendingCount} unsynced change${pendingCount === 1 ? '' : 's'} that will be lost. Log out anyway?`
        : 'Log out of StockRoom?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Appbar.Header mode="small" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="More" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.container}>
        <List.Section>
          <List.Subheader>Signed in as</List.Subheader>
          <List.Item
            title={myName ?? ''}
            description={`${org?.name ?? ''} · ${role ?? ''}`}
            left={(p) => <List.Icon {...p} icon="account-circle-outline" />}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Catalog</List.Subheader>
          <List.Item
            title="Categories"
            left={(p) => <List.Icon {...p} icon="tag-multiple-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/categories')}
          />
          <List.Item
            title="Suppliers"
            left={(p) => <List.Icon {...p} icon="truck-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/suppliers')}
          />
          <List.Item
            title="Stocktake"
            description="Count stock by scanning"
            left={(p) => <List.Icon {...p} icon="counter" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/stocktake')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Insights</List.Subheader>
          <List.Item
            title="Alerts"
            description="Low & out-of-stock items"
            left={(p) => <List.Icon {...p} icon="bell-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/alerts')}
          />
          <List.Item
            title="Reports"
            description="Valuation, movements, dead stock, CSV export"
            left={(p) => <List.Icon {...p} icon="chart-box-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/reports')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Organization</List.Subheader>
          <List.Item
            title="Team"
            description="Members, invites, roles"
            left={(p) => <List.Icon {...p} icon="account-group-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/team')}
          />
          {can.manageOrg(role) ? (
            <List.Item
              title="Organization settings"
              description="Name, logo, currency, tax rate"
              left={(p) => <List.Icon {...p} icon="office-building-cog-outline" />}
              right={(p) => <List.Icon {...p} icon="chevron-right" />}
              onPress={() => router.push('/org-settings')}
            />
          ) : null}
        </List.Section>

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as ThemeMode)}
            buttons={[
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
            style={{ marginHorizontal: 16 }}
          />
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />
        <List.Item
          title="Log out"
          titleStyle={{ color: theme.colors.error }}
          left={(p) => <List.Icon {...p} icon="logout" color={theme.colors.error} />}
          onPress={confirmSignOut}
        />
        {lastSyncAt ? (
          <Text variant="labelSmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Last synced {new Date(lastSyncAt).toLocaleString()}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 48 },
});
