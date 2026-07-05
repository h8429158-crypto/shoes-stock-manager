import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { StockStatusChip } from '@/components/stock-status-chip';
import { can, stockStatus, suggestedReorderQty, type Product } from '@/lib/types';
import { useActiveRole } from '@/store/auth';
import { useDataStore } from '@/store/data';

/** Low/out-of-stock products with suggested reorder quantities and one-tap PO. */
export default function AlertsScreen() {
  const theme = useTheme();
  const role = useActiveRole();
  const { products, suppliers } = useDataStore();

  const alerts = useMemo(
    () =>
      products
        .filter((p) => !p.archived && stockStatus(p) !== 'in_stock')
        .sort((a, b) => a.quantity - b.quantity),
    [products]
  );

  const bySupplier = useMemo(() => {
    const groups = new Map<string | null, Product[]>();
    for (const p of alerts) {
      const key = p.supplier_id;
      groups.set(key, [...(groups.get(key) ?? []), p]);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [alerts]);

  const manage = can.manageOrders(role);

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon="check-circle-outline"
        title="All stocked up"
        message="Nothing is low or out of stock right now."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {alerts.length} product{alerts.length === 1 ? '' : 's'} need attention. Suggested quantities
        top stock back up to twice the reorder level.
      </Text>

      {bySupplier.map(([supplierId, group]) => {
        const supplier = suppliers.find((s) => s.id === supplierId);
        return (
          <Card key={supplierId ?? 'none'} mode="contained">
            <Card.Title
              title={supplier?.name ?? 'No supplier set'}
              subtitle={`${group.length} item${group.length === 1 ? '' : 's'}`}
              titleVariant="titleMedium"
            />
            <Card.Content style={{ paddingHorizontal: 0 }}>
              {group.map((p) => (
                <List.Item
                  key={p.id}
                  title={p.name}
                  description={`${p.quantity} left · reorder at ${p.reorder_level} · suggest +${suggestedReorderQty(p)}`}
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                  right={() => (
                    <View style={{ justifyContent: 'center' }}>
                      <StockStatusChip product={p} />
                    </View>
                  )}
                />
              ))}
            </Card.Content>
            {manage && supplier ? (
              <Card.Actions>
                <Button
                  icon="clipboard-plus-outline"
                  mode="contained-tonal"
                  onPress={() => router.push({ pathname: '/po/new', params: { supplierId: supplier.id } })}
                >
                  Create PO for {supplier.name}
                </Button>
              </Card.Actions>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
});
