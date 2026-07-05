import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Appbar, Chip, FAB, List, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { OfflineBanner } from '@/components/offline-banner';
import { refetchAll } from '@/db/sync';
import { formatMoney } from '@/lib/money';
import { can, type PoStatus } from '@/lib/types';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';

const STATUS_COLORS: Record<PoStatus, string> = {
  draft: '#6B7280',
  sent: '#1F6FEB',
  received: '#16A34A',
  cancelled: '#DC2626',
};

export default function OrdersScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const role = useActiveRole();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const { purchaseOrders, poItems, invoices, invoiceItems, suppliers } = useDataStore();
  const [tab, setTab] = useState<'pos' | 'invoices'>('pos');
  const [refreshing, setRefreshing] = useState(false);

  const currency = org?.currency ?? 'USD';
  const manage = can.manageOrders(role);

  const onRefresh = async () => {
    if (!activeOrgId) return;
    setRefreshing(true);
    await refetchAll(activeOrgId);
    setRefreshing(false);
  };

  const poTotal = (poId: string) =>
    poItems.filter((i) => i.purchase_order_id === poId).reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const invoiceTotal = (invId: string) =>
    invoiceItems.filter((i) => i.invoice_id === invId).reduce((s, i) => s + i.quantity * i.unit_price, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Appbar.Header mode="small" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Orders" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>
      <OfflineBanner />

      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'pos' | 'invoices')}
        buttons={[
          { value: 'pos', label: 'Purchase orders', icon: 'clipboard-text-outline' },
          { value: 'invoices', label: 'Invoices', icon: 'receipt' },
        ]}
        style={styles.segments}
      />

      {tab === 'pos' ? (
        <FlatList
          data={purchaseOrders}
          keyExtractor={(po) => po.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            return (
              <List.Item
                title={`${item.po_number} · ${supplier?.name ?? 'No supplier'}`}
                titleStyle={{ fontWeight: '600' }}
                description={`${format(new Date(item.created_at), 'd MMM yyyy')}${
                  item.expected_date ? ` · expected ${format(new Date(item.expected_date), 'd MMM')}` : ''
                }`}
                onPress={() => router.push({ pathname: '/po/[id]', params: { id: item.id } })}
                right={() => (
                  <View style={styles.rowRight}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                      {formatMoney(poTotal(item.id), currency)}
                    </Text>
                    <Chip
                      compact
                      textStyle={{ color: STATUS_COLORS[item.status], fontSize: 11 }}
                      style={{ backgroundColor: STATUS_COLORS[item.status] + '22' }}
                    >
                      {item.status}
                    </Chip>
                  </View>
                )}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-text-outline"
              title="No purchase orders"
              message={manage ? 'Create a PO to restock from a supplier.' : 'POs created by managers appear here.'}
              actionLabel={manage ? 'New purchase order' : undefined}
              onAction={() => router.push('/po/new')}
            />
          }
          contentContainerStyle={purchaseOrders.length === 0 ? styles.emptyList : styles.list}
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(inv) => inv.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <List.Item
              title={`${item.invoice_number} · ${item.customer_name}`}
              titleStyle={{ fontWeight: '600' }}
              description={format(new Date(item.created_at), 'd MMM yyyy, HH:mm')}
              onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: item.id } })}
              right={() => (
                <View style={styles.rowRight}>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {formatMoney(
                      Math.round(invoiceTotal(item.id) * (1 + item.tax_rate / 100)),
                      currency
                    )}
                  </Text>
                </View>
              )}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt"
              title="No invoices"
              message={manage ? 'Create a sales invoice — sold items stock out automatically.' : 'Invoices appear here.'}
              actionLabel={manage ? 'New invoice' : undefined}
              onAction={() => router.push('/invoice/new')}
            />
          }
          contentContainerStyle={invoices.length === 0 ? styles.emptyList : styles.list}
        />
      )}

      {manage ? (
        <FAB
          icon="plus"
          label={tab === 'pos' ? 'New PO' : 'New invoice'}
          style={styles.fab}
          onPress={() => router.push(tab === 'pos' ? '/po/new' : '/invoice/new')}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segments: { marginHorizontal: 16, marginBottom: 8 },
  rowRight: { alignItems: 'flex-end', gap: 4, justifyContent: 'center' },
  list: { paddingBottom: 96 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
