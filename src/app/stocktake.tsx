import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Text, TextInput, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { applyStocktake } from '@/db/mutations';
import { useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';
import { useStocktakeStore } from '@/store/stocktake';

/** Review scan-counted quantities and apply corrections in bulk. */
export default function StocktakeScreen() {
  const theme = useTheme();
  const { activeOrgId, session } = useAuthStore();
  const products = useDataStore((s) => s.products);
  const { counts, setCount, remove, clear } = useStocktakeStore();

  const rows = Object.entries(counts)
    .map(([productId, counted]) => ({
      product: products.find((p) => p.id === productId),
      counted,
    }))
    .filter((r): r is { product: NonNullable<typeof r.product>; counted: number } => !!r.product);

  const corrections = rows.filter((r) => r.counted !== r.product.quantity);

  const apply = () => {
    if (!activeOrgId || !session) return;
    Alert.alert(
      'Apply stocktake',
      `${corrections.length} product${corrections.length === 1 ? '' : 's'} will be corrected. Each correction is recorded as an adjustment movement.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply corrections',
          onPress: () => {
            applyStocktake(
              activeOrgId,
              session.user.id,
              corrections.map((r) => ({ product: r.product, countedQuantity: r.counted }))
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            clear();
            router.back();
          },
        },
      ]
    );
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="counter"
        title="Nothing counted yet"
        message="Turn on Continuous count in the scanner and scan items to build a count."
        actionLabel="Go to scanner"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.product.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => {
          const delta = item.counted - item.product.quantity;
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" numberOfLines={1} style={{ fontWeight: '600' }}>
                  {item.product.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  System: {item.product.quantity} · Counted: {item.counted}
                  {delta !== 0 ? ` · ${delta > 0 ? '+' : ''}${delta}` : ' · matches'}
                </Text>
              </View>
              <TextInput
                mode="outlined"
                dense
                keyboardType="number-pad"
                value={String(item.counted)}
                onChangeText={(t) => setCount(item.product.id, parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)}
                style={styles.countInput}
              />
              <IconButton icon="close" size={18} onPress={() => remove(item.product.id)} />
            </View>
          );
        }}
      />
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {corrections.length} of {rows.length} need correction
        </Text>
        <Button mode="contained" icon="check-all" onPress={apply} disabled={corrections.length === 0}>
          Apply corrections
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  countInput: { width: 76, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 28,
  },
});
