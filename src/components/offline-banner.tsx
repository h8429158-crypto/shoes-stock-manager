import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { useSyncStore } from '@/store/sync';

/** Subtle banner shown while offline, with the pending-sync count. */
export function OfflineBanner() {
  const { online, pendingCount, syncing } = useSyncStore();
  const theme = useTheme();

  if (online && pendingCount === 0) return null;

  const label = !online
    ? pendingCount > 0
      ? `Offline — ${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync`
      : 'Offline — showing saved data'
    : syncing
      ? `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}…`
      : `${pendingCount} change${pendingCount === 1 ? '' : 's'} queued`;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: online ? theme.colors.secondaryContainer : theme.colors.tertiaryContainer },
      ]}
    >
      <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
});
