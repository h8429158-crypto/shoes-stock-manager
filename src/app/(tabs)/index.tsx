import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfDay, subDays } from 'date-fns';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Badge, Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HorizontalBarChart, MovementColumns, type DailyFlow } from '@/components/charts';
import { OfflineBanner } from '@/components/offline-banner';
import { Skeleton } from '@/components/skeleton';
import { SummaryCard } from '@/components/summary-card';
import { refetchAll } from '@/db/sync';
import { formatMoney } from '@/lib/money';
import { statusColors } from '@/lib/theme';
import { stockStatus, type StockMovement } from '@/lib/types';
import { useActiveOrg, useAuthStore } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

function describeMovement(m: StockMovement, sku: string, who: string): string {
  const qty = Math.abs(m.quantity_change);
  if (m.type === 'adjust') return `${who} adjusted ${sku} by ${m.quantity_change > 0 ? '+' : ''}${m.quantity_change}`;
  if (m.quantity_change > 0) return `${who} stocked in ${qty}× ${sku}`;
  return `${who} stocked out ${qty}× ${sku}`;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const { products, categories, movements, profiles, hydratedOrgId } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);

  const currency = org?.currency ?? 'USD';
  const active = products.filter((p) => !p.archived);
  const loading = hydratedOrgId === null;

  const stockValue = active.reduce((s, p) => s + p.quantity * p.cost_price, 0);
  const lowCount = active.filter((p) => stockStatus(p) === 'low_stock').length;
  const outCount = active.filter((p) => stockStatus(p) === 'out_of_stock').length;
  const alertCount = lowCount + outCount;

  const valueByCategory = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const p of active) {
      const key = p.category_id ?? '__none';
      byCat.set(key, (byCat.get(key) ?? 0) + p.quantity * p.cost_price);
    }
    const rows = [...byCat.entries()]
      .map(([catId, value]) => ({
        label: catId === '__none' ? 'Uncategorized' : (categories.find((c) => c.id === catId)?.name ?? 'Unknown'),
        value,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const top = rows.slice(0, 6);
    const rest = rows.slice(6).reduce((s, r) => s + r.value, 0);
    if (rest > 0) top.push({ label: 'Other', value: rest });
    return top.map((r) => ({ ...r, valueLabel: formatMoney(r.value, currency) }));
  }, [active, categories, currency]);

  const dailyFlows: DailyFlow[] = useMemo(() => {
    const days = 30;
    const start = startOfDay(subDays(new Date(), days - 1));
    const flows: DailyFlow[] = Array.from({ length: days }, (_, i) => {
      const day = subDays(new Date(), days - 1 - i);
      const isLabeled = i % 7 === 0 || i === days - 1;
      return { label: isLabeled ? format(day, 'd MMM') : '', inQty: 0, outQty: 0 };
    });
    for (const m of movements) {
      const t = new Date(m.created_at);
      if (t < start) continue;
      const idx = Math.min(days - 1, Math.floor((startOfDay(t).getTime() - start.getTime()) / 86400e3));
      if (idx < 0) continue;
      if (m.quantity_change > 0) flows[idx].inQty += m.quantity_change;
      else flows[idx].outQty += -m.quantity_change;
    }
    return flows;
  }, [movements]);

  const feed = movements.slice(0, 15);

  const onRefresh = async () => {
    if (!activeOrgId) return;
    setRefreshing(true);
    await refetchAll(activeOrgId);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Appbar.Header mode="small" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title={org?.name ?? 'Dashboard'} titleStyle={{ fontWeight: '700' }} />
        <View>
          <Appbar.Action icon="bell-outline" onPress={() => router.push('/alerts')} />
          {alertCount > 0 ? <Badge style={styles.bellBadge}>{alertCount}</Badge> : null}
        </View>
      </Appbar.Header>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <View style={styles.cardsRow}>
              <Skeleton style={{ flex: 1, height: 100, borderRadius: 12 }} />
              <Skeleton style={{ flex: 1, height: 100, borderRadius: 12 }} />
            </View>
            <Skeleton style={{ height: 180, borderRadius: 12 }} />
          </View>
        ) : (
          <>
            <View style={styles.cardsRow}>
              <SummaryCard
                icon="shoe-sneaker"
                label="Products"
                value={String(active.length)}
                onPress={() => router.push('/(tabs)/products')}
              />
              <SummaryCard icon="cash-multiple" label="Stock value" value={formatMoney(stockValue, currency)} />
            </View>
            <View style={styles.cardsRow}>
              <SummaryCard
                icon="alert-outline"
                label="Low stock"
                value={String(lowCount)}
                tint={statusColors.low_stock}
                onPress={() => router.push('/alerts')}
              />
              <SummaryCard
                icon="close-octagon-outline"
                label="Out of stock"
                value={String(outCount)}
                tint={statusColors.out_of_stock}
                onPress={() => router.push('/alerts')}
              />
            </View>

            <Card mode="contained">
              <Card.Title title="Stock value by category" titleVariant="titleMedium" />
              <Card.Content>
                {valueByCategory.length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Add products to see value by category.
                  </Text>
                ) : (
                  <HorizontalBarChart data={valueByCategory} />
                )}
              </Card.Content>
            </Card>

            <Card mode="contained">
              <Card.Title title="Movements — last 30 days" titleVariant="titleMedium" />
              <Card.Content>
                <MovementColumns data={dailyFlows} />
              </Card.Content>
            </Card>

            <Card mode="contained">
              <Card.Title title="Recent activity" titleVariant="titleMedium" />
              <Card.Content style={{ paddingHorizontal: 0 }}>
                {feed.length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 16 }}>
                    Stock movements from your team will show up here.
                  </Text>
                ) : (
                  feed.map((m) => {
                    const product = products.find((p) => p.id === m.product_id);
                    const who = userName(profiles, m.user_id);
                    return (
                      <List.Item
                        key={m.id}
                        title={describeMovement(m, product?.sku ?? 'deleted item', who)}
                        titleNumberOfLines={2}
                        description={`${product?.name ?? ''} · ${format(new Date(m.created_at), 'd MMM, HH:mm')}`}
                        left={() => (
                          <View style={[styles.feedIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <MaterialCommunityIcons
                              name={m.quantity_change > 0 ? 'tray-arrow-down' : 'tray-arrow-up'}
                              size={16}
                              color={m.quantity_change > 0 ? statusColors.in_stock : statusColors.low_stock}
                            />
                          </View>
                        )}
                        onPress={
                          product
                            ? () => router.push({ pathname: '/product/[id]', params: { id: product.id } })
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  cardsRow: { flexDirection: 'row', gap: 12 },
  bellBadge: { position: 'absolute', top: 6, right: 6 },
  feedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 16,
  },
});
