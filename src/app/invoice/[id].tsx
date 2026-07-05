import { format } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, List, Snackbar, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/lib/money';
import { buildDocumentHtml, printAndShare } from '@/lib/pdf';
import { useActiveOrg } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

export default function InvoiceDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const org = useActiveOrg();
  const { invoices, invoiceItems, profiles } = useDataStore();
  const [snack, setSnack] = useState('');
  const [sharing, setSharing] = useState(false);

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice || !org) {
    return <EmptyState icon="alert-circle-outline" title="Invoice not found" />;
  }

  const items = invoiceItems.filter((i) => i.invoice_id === invoice.id);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const tax = Math.round((subtotal * invoice.tax_rate) / 100);

  const sharePdf = async () => {
    setSharing(true);
    try {
      const html = buildDocumentHtml({
        org,
        title: 'Invoice',
        docNumber: invoice.invoice_number,
        date: format(new Date(invoice.created_at), 'd MMM yyyy'),
        partyLabel: 'Bill to',
        partyName: invoice.customer_name,
        lines: items.map((i) => ({
          name: i.description || 'Item',
          detail: '',
          quantity: i.quantity,
          unitCents: i.unit_price,
        })),
        taxRate: invoice.tax_rate,
        notes: invoice.notes || undefined,
      });
      await printAndShare(html);
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Could not generate PDF');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: invoice.invoice_number }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card mode="contained">
          <Card.Content style={{ gap: 4 }}>
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              {invoice.invoice_number}
            </Text>
            <Text variant="bodyMedium">{invoice.customer_name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(invoice.created_at), 'd MMM yyyy, HH:mm')} · by {userName(profiles, invoice.created_by)}
            </Text>
            {invoice.notes ? <Text variant="bodySmall">{invoice.notes}</Text> : null}
          </Card.Content>
        </Card>

        {items.map((i) => (
          <List.Item
            key={i.id}
            title={i.description || 'Item'}
            description={`${i.quantity} × ${formatMoney(i.unit_price, org.currency)}`}
            right={() => (
              <Text variant="bodyMedium" style={{ fontWeight: '600', alignSelf: 'center' }}>
                {formatMoney(i.quantity * i.unit_price, org.currency)}
              </Text>
            )}
          />
        ))}
        <Divider />
        <View style={styles.totalRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Subtotal
          </Text>
          <Text variant="bodyMedium">{formatMoney(subtotal, org.currency)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Tax ({invoice.tax_rate}%)
          </Text>
          <Text variant="bodyMedium">{formatMoney(tax, org.currency)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text variant="titleMedium">Total</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {formatMoney(subtotal + tax, org.currency)}
          </Text>
        </View>

        <Button mode="contained" icon="file-pdf-box" onPress={sharePdf} loading={sharing} disabled={sharing}>
          Share PDF
        </Button>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 48 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
});
