import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, List, Snackbar, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { deletePurchaseOrder, receivePurchaseOrder, updatePoStatus } from '@/db/mutations';
import { formatMoney } from '@/lib/money';
import { buildDocumentHtml, printAndShare } from '@/lib/pdf';
import { can } from '@/lib/types';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

export default function PoDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const org = useActiveOrg();
  const role = useActiveRole();
  const session = useAuthStore((s) => s.session);
  const { purchaseOrders, poItems, products, suppliers, profiles } = useDataStore();
  const [snack, setSnack] = useState('');
  const [sharing, setSharing] = useState(false);

  const po = purchaseOrders.find((p) => p.id === id);
  if (!po || !org) {
    return <EmptyState icon="alert-circle-outline" title="Purchase order not found" />;
  }

  const manage = can.manageOrders(role);
  const supplier = suppliers.find((s) => s.id === po.supplier_id);
  const items = poItems.filter((i) => i.purchase_order_id === po.id);
  const productName = (pid: string) => products.find((p) => p.id === pid)?.name ?? 'Deleted product';
  const productSku = (pid: string) => products.find((p) => p.id === pid)?.sku ?? '';
  const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const receive = () => {
    if (!session) return;
    Alert.alert(
      'Receive purchase order',
      `Stock in all ${items.length} line item${items.length === 1 ? '' : 's'}? Each line is recorded as a stock-in movement.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Receive all',
          onPress: () => {
            receivePurchaseOrder(po, session.user.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  const sharePdf = async () => {
    setSharing(true);
    try {
      const html = buildDocumentHtml({
        org,
        title: 'Purchase Order',
        docNumber: po.po_number,
        date: format(new Date(po.created_at), 'd MMM yyyy'),
        partyLabel: 'Supplier',
        partyName: supplier?.name ?? '—',
        lines: items.map((i) => ({
          name: productName(i.product_id),
          detail: productSku(i.product_id),
          quantity: i.quantity,
          unitCents: i.unit_cost,
        })),
        taxRate: 0,
        notes: po.notes || undefined,
        meta: [
          { label: 'Status', value: po.status.toUpperCase() },
          ...(po.expected_date ? [{ label: 'Expected', value: po.expected_date }] : []),
          ...(supplier?.email ? [{ label: 'Supplier email', value: supplier.email }] : []),
        ],
      });
      await printAndShare(html);
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Could not generate PDF');
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete purchase order', `Delete ${po.po_number}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePurchaseOrder(po);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: po.po_number }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card mode="contained">
          <Card.Content style={{ gap: 6 }}>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                {po.po_number}
              </Text>
              <Chip compact>{po.status}</Chip>
            </View>
            <Text variant="bodyMedium">{supplier?.name ?? 'No supplier'}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Created {format(new Date(po.created_at), 'd MMM yyyy')} by {userName(profiles, po.created_by)}
              {po.expected_date ? ` · expected ${format(new Date(po.expected_date), 'd MMM yyyy')}` : ''}
            </Text>
            {po.status === 'received' && po.received_at ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Received {format(new Date(po.received_at), 'd MMM yyyy, HH:mm')} by {userName(profiles, po.received_by)}
              </Text>
            ) : null}
            {po.notes ? <Text variant="bodySmall">{po.notes}</Text> : null}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 4 }}>
          Items
        </Text>
        {items.map((i) => (
          <List.Item
            key={i.id}
            title={productName(i.product_id)}
            description={`${i.quantity} × ${formatMoney(i.unit_cost, org.currency)}`}
            right={() => (
              <Text variant="bodyMedium" style={{ fontWeight: '600', alignSelf: 'center' }}>
                {formatMoney(i.quantity * i.unit_cost, org.currency)}
              </Text>
            )}
          />
        ))}
        <Divider />
        <View style={styles.totalRow}>
          <Text variant="titleMedium">Total</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {formatMoney(total, org.currency)}
          </Text>
        </View>

        <Button mode="outlined" icon="file-pdf-box" onPress={sharePdf} loading={sharing} disabled={sharing}>
          Share PDF
        </Button>

        {manage && po.status === 'draft' ? (
          <Button mode="contained" icon="send" onPress={() => updatePoStatus(po, 'sent')}>
            Mark as sent
          </Button>
        ) : null}
        {manage && (po.status === 'sent' || po.status === 'draft') ? (
          <Button mode="contained" icon="package-down" onPress={receive}>
            Receive — stock in all items
          </Button>
        ) : null}
        {manage && po.status !== 'received' ? (
          <View style={styles.secondaryActions}>
            {po.status !== 'cancelled' ? (
              <Button mode="text" textColor={theme.colors.error} onPress={() => updatePoStatus(po, 'cancelled')}>
                Cancel PO
              </Button>
            ) : null}
            <Button mode="text" textColor={theme.colors.error} onPress={confirmDelete}>
              Delete
            </Button>
          </View>
        ) : null}
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  secondaryActions: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
