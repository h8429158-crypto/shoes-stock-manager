import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, List, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { StockStatusChip } from '@/components/stock-status-chip';
import { deleteProduct } from '@/db/mutations';
import { formatMoney } from '@/lib/money';
import { can, type StockMovement } from '@/lib/types';
import { useActiveOrg, useActiveRole } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

const REASON_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  damage: 'Damage',
  return: 'Return',
  adjustment: 'Adjustment',
  stocktake: 'Stocktake',
  po_received: 'PO received',
  initial: 'Initial stock',
};

export default function ProductDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const org = useActiveOrg();
  const role = useActiveRole();
  const { products, categories, suppliers, movements, profiles } = useDataStore();

  const product = products.find((p) => p.id === id);
  if (!product) {
    return <EmptyState icon="alert-circle-outline" title="Product not found" message="It may have been deleted." />;
  }

  const currency = org?.currency ?? 'USD';
  const category = categories.find((c) => c.id === product.category_id);
  const supplier = suppliers.find((s) => s.id === product.supplier_id);
  const history = movements.filter((m) => m.product_id === product.id).slice(0, 25);
  const manage = can.manageProducts(role);

  const confirmDelete = () => {
    Alert.alert('Delete product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProduct(product.id);
          router.back();
        },
      },
    ]);
  };

  const movementIcon = (m: StockMovement) =>
    m.quantity_change > 0 ? 'tray-arrow-down' : m.type === 'adjust' ? 'scale-balance' : 'tray-arrow-up';

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoEmpty, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="shoe-sneaker" size={36} color={theme.colors.onSurfaceVariant} />
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              {product.name}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {product.sku}
              {product.barcode ? `  ·  ${product.barcode}` : ''}
            </Text>
            <StockStatusChip product={product} />
          </View>
        </View>

        <Card mode="contained">
          <Card.Content style={styles.statsRow}>
            <Stat label="On hand" value={`${product.quantity} ${product.unit}`} />
            <Stat label="Reorder at" value={String(product.reorder_level)} />
            <Stat label="Cost" value={formatMoney(product.cost_price, currency)} />
            <Stat label="Price" value={formatMoney(product.selling_price, currency)} />
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="tray-arrow-down"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/stock-op', params: { productId: product.id, type: 'in' } })}
          >
            Stock in
          </Button>
          <Button
            mode="contained-tonal"
            icon="tray-arrow-up"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/stock-op', params: { productId: product.id, type: 'out' } })}
          >
            Stock out
          </Button>
        </View>
        {manage ? (
          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="pencil-outline"
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/product/edit/[id]', params: { id: product.id } })}
            >
              Edit
            </Button>
            <Button mode="outlined" icon="trash-can-outline" textColor={theme.colors.error} style={{ flex: 1 }} onPress={confirmDelete}>
              Delete
            </Button>
          </View>
        ) : null}

        <List.Section>
          <List.Item title="Category" description={category?.name ?? '—'} left={(p) => <List.Icon {...p} icon="tag-outline" />} />
          <List.Item title="Supplier" description={supplier?.name ?? '—'} left={(p) => <List.Icon {...p} icon="truck-outline" />} />
          <List.Item
            title="Stock value (cost)"
            description={formatMoney(product.quantity * product.cost_price, currency)}
            left={(p) => <List.Icon {...p} icon="cash" />}
          />
          {product.notes ? (
            <List.Item title="Notes" description={product.notes} descriptionNumberOfLines={6} left={(p) => <List.Icon {...p} icon="note-text-outline" />} />
          ) : null}
        </List.Section>

        <Divider />
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent movements
        </Text>
        {history.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 4 }}>
            No stock movements yet.
          </Text>
        ) : (
          history.map((m) => (
            <List.Item
              key={m.id}
              title={`${m.quantity_change > 0 ? '+' : ''}${m.quantity_change} · ${REASON_LABELS[m.reason] ?? m.reason}`}
              description={`${userName(profiles, m.user_id)} · ${format(new Date(m.created_at), 'd MMM yyyy, HH:mm')}${m.note ? `\n${m.note}` : ''}`}
              descriptionNumberOfLines={3}
              left={(p) => <List.Icon {...p} icon={movementIcon(m)} />}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="titleMedium" style={{ fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 48 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  photo: { width: 84, height: 84, borderRadius: 14 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontWeight: '700', marginTop: 4 },
});
