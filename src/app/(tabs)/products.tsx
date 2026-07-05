import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Chip, Divider, FAB, Menu, Searchbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { OfflineBanner } from '@/components/offline-banner';
import { ProductListItem } from '@/components/product-list-item';
import { ProductListSkeleton } from '@/components/skeleton';
import { deleteProduct } from '@/db/mutations';
import { refetchAll } from '@/db/sync';
import { can, stockStatus, type Product, type StockStatus } from '@/lib/types';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';
import { useSyncStore } from '@/store/sync';

type SortKey = 'name' | 'quantity_asc' | 'quantity_desc' | 'value' | 'recent';

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name (A–Z)',
  quantity_asc: 'Quantity (low first)',
  quantity_desc: 'Quantity (high first)',
  value: 'Stock value',
  recent: 'Recently updated',
};

const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low',
  out_of_stock: 'Out',
};

export default function ProductsScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const role = useActiveRole();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const { products, categories, hydratedOrgId } = useDataStore();
  const syncing = useSyncStore((s) => s.syncing);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<StockStatus | null>(null);
  const [sort, setSort] = useState<SortKey>('name');
  const [sortMenu, setSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currency = org?.currency ?? 'USD';
  const manage = can.manageProducts(role);
  const loading = hydratedOrgId === null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => !p.archived);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q)
      );
    }
    if (categoryId) list = list.filter((p) => p.category_id === categoryId);
    if (status) list = list.filter((p) => stockStatus(p) === status);

    const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      quantity_asc: (a, b) => a.quantity - b.quantity,
      quantity_desc: (a, b) => b.quantity - a.quantity,
      value: (a, b) => b.quantity * b.cost_price - a.quantity * a.cost_price,
      recent: (a, b) => b.updated_at.localeCompare(a.updated_at),
    };
    return [...list].sort(sorters[sort]);
  }, [products, query, categoryId, status, sort]);

  const onRefresh = async () => {
    if (!activeOrgId) return;
    setRefreshing(true);
    await refetchAll(activeOrgId);
    setRefreshing(false);
  };

  const confirmDelete = (product: Product) => {
    Alert.alert('Delete product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(product.id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Appbar.Header mode="small" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Products" titleStyle={{ fontWeight: '700' }} />
        <Menu
          visible={sortMenu}
          onDismiss={() => setSortMenu(false)}
          anchor={<Appbar.Action icon="sort" onPress={() => setSortMenu(true)} />}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <Menu.Item
              key={key}
              title={SORT_LABELS[key]}
              trailingIcon={sort === key ? 'check' : undefined}
              onPress={() => {
                setSort(key);
                setSortMenu(false);
              }}
            />
          ))}
        </Menu>
      </Appbar.Header>
      <OfflineBanner />

      <View style={styles.searchWrap}>
        <Searchbar placeholder="Search name, SKU or barcode" value={query} onChangeText={setQuery} />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip selected={!categoryId && !status} onPress={() => { setCategoryId(null); setStatus(null); }} compact>
            All
          </Chip>
          {(Object.keys(STATUS_LABELS) as StockStatus[]).map((s) => (
            <Chip key={s} selected={status === s} onPress={() => setStatus(status === s ? null : s)} compact>
              {STATUS_LABELS[s]}
            </Chip>
          ))}
          <Divider style={{ width: 1, height: '80%' }} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
              compact
            >
              {c.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading && products.length === 0 ? (
        <ProductListSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing || syncing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <ProductListItem
              product={item}
              currency={currency}
              canManage={manage}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              onStockIn={() => router.push({ pathname: '/stock-op', params: { productId: item.id, type: 'in' } })}
              onStockOut={() => router.push({ pathname: '/stock-op', params: { productId: item.id, type: 'out' } })}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="shoe-sneaker"
              title={query || categoryId || status ? 'No matching products' : 'No products yet'}
              message={
                query || categoryId || status
                  ? 'Try changing your search or filters.'
                  : manage
                    ? 'Add your first product to start tracking stock.'
                    : 'Products added by your team will appear here.'
              }
              actionLabel={manage && !query ? 'Add product' : undefined}
              onAction={() => router.push('/product/new')}
            />
          }
          contentContainerStyle={filtered.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 96 }}
        />
      )}

      {manage ? (
        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/product/new')} label="Add" />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  chips: { gap: 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
