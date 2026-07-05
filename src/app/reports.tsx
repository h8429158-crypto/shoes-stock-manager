import { format, subDays } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, DataTable, Menu, SegmentedButtons, Snackbar, Text, useTheme } from 'react-native-paper';

import { shareCsv, toCsv } from '@/lib/csv';
import { formatMoney } from '@/lib/money';
import { useActiveOrg } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

type Report = 'valuation' | 'movements' | 'dead';

const DATE_RANGES = [7, 30, 90] as const;
const DEAD_RANGES = [30, 60, 90] as const;

export default function ReportsScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const { products, categories, movements, members, profiles } = useDataStore();

  const [report, setReport] = useState<Report>('valuation');
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [deadDays, setDeadDays] = useState<number>(60);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [snack, setSnack] = useState('');

  const currency = org?.currency ?? 'USD';
  const active = products.filter((p) => !p.archived);

  // --- valuation ---
  const valuation = useMemo(() => {
    const rows = active.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: categories.find((c) => c.id === p.category_id)?.name ?? '—',
      quantity: p.quantity,
      costValue: p.quantity * p.cost_price,
      retailValue: p.quantity * p.selling_price,
    }));
    rows.sort((a, b) => b.costValue - a.costValue);
    return rows;
  }, [active, categories]);
  const totalCost = valuation.reduce((s, r) => s + r.costValue, 0);
  const totalRetail = valuation.reduce((s, r) => s + r.retailValue, 0);

  // --- movement history ---
  const since = useMemo(() => subDays(new Date(), rangeDays), [rangeDays]);
  const history = useMemo(
    () =>
      movements.filter(
        (m) => new Date(m.created_at) >= since && (!userFilter || m.user_id === userFilter)
      ),
    [movements, since, userFilter]
  );

  // --- dead stock ---
  const dead = useMemo(() => {
    const cutoff = subDays(new Date(), deadDays).toISOString();
    const lastMove = new Map<string, string>();
    for (const m of movements) {
      const prev = lastMove.get(m.product_id);
      if (!prev || m.created_at > prev) lastMove.set(m.product_id, m.created_at);
    }
    return active
      .filter((p) => p.quantity > 0)
      .map((p) => ({ product: p, last: lastMove.get(p.id) ?? null }))
      .filter((r) => !r.last || r.last < cutoff)
      .sort((a, b) => (a.last ?? '').localeCompare(b.last ?? ''));
  }, [active, movements, deadDays]);

  const exportCsv = async () => {
    try {
      if (report === 'valuation') {
        await shareCsv(
          `valuation-${format(new Date(), 'yyyyMMdd')}.csv`,
          toCsv(
            ['Product', 'SKU', 'Category', 'Quantity', 'Cost value', 'Retail value'],
            valuation.map((r) => [r.name, r.sku, r.category, r.quantity, (r.costValue / 100).toFixed(2), (r.retailValue / 100).toFixed(2)])
          )
        );
      } else if (report === 'movements') {
        await shareCsv(
          `movements-${format(new Date(), 'yyyyMMdd')}.csv`,
          toCsv(
            ['Date', 'Product', 'SKU', 'Change', 'Type', 'Reason', 'User', 'Note'],
            history.map((m) => {
              const p = products.find((x) => x.id === m.product_id);
              return [
                format(new Date(m.created_at), 'yyyy-MM-dd HH:mm'),
                p?.name ?? 'deleted',
                p?.sku ?? '',
                m.quantity_change,
                m.type,
                m.reason,
                userName(profiles, m.user_id),
                m.note,
              ];
            })
          )
        );
      } else {
        await shareCsv(
          `dead-stock-${format(new Date(), 'yyyyMMdd')}.csv`,
          toCsv(
            ['Product', 'SKU', 'Quantity', 'Cost value', 'Last movement'],
            dead.map((r) => [
              r.product.name,
              r.product.sku,
              r.product.quantity,
              (r.product.quantity * r.product.cost_price / 100).toFixed(2),
              r.last ? format(new Date(r.last), 'yyyy-MM-dd') : 'never',
            ])
          )
        );
      }
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SegmentedButtons
        value={report}
        onValueChange={(v) => setReport(v as Report)}
        buttons={[
          { value: 'valuation', label: 'Valuation' },
          { value: 'movements', label: 'Movements' },
          { value: 'dead', label: 'Dead stock' },
        ]}
      />

      {report === 'valuation' ? (
        <>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">
              Cost value <Text style={{ fontWeight: '700' }}>{formatMoney(totalCost, currency)}</Text>
            </Text>
            <Text variant="bodyMedium">
              Retail <Text style={{ fontWeight: '700' }}>{formatMoney(totalRetail, currency)}</Text>
            </Text>
          </View>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 2 }}>Product</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title numeric>Value</DataTable.Title>
            </DataTable.Header>
            {valuation.slice(0, 50).map((r) => (
              <DataTable.Row key={r.sku}>
                <DataTable.Cell style={{ flex: 2 }}>{r.name}</DataTable.Cell>
                <DataTable.Cell numeric>{r.quantity}</DataTable.Cell>
                <DataTable.Cell numeric>{formatMoney(r.costValue, currency)}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </>
      ) : null}

      {report === 'movements' ? (
        <>
          <View style={styles.filterRow}>
            {DATE_RANGES.map((d) => (
              <Chip key={d} compact selected={rangeDays === d} onPress={() => setRangeDays(d)}>
                {d}d
              </Chip>
            ))}
            <Menu
              visible={userMenu}
              onDismiss={() => setUserMenu(false)}
              anchor={
                <Chip compact icon="account-outline" onPress={() => setUserMenu(true)}>
                  {userFilter ? userName(profiles, userFilter) : 'All users'}
                </Chip>
              }
            >
              <Menu.Item title="All users" onPress={() => { setUserFilter(null); setUserMenu(false); }} />
              {members.map((m) => (
                <Menu.Item
                  key={m.user_id}
                  title={userName(profiles, m.user_id)}
                  onPress={() => { setUserFilter(m.user_id); setUserMenu(false); }}
                />
              ))}
            </Menu>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {history.length} movement{history.length === 1 ? '' : 's'} since {format(since, 'd MMM yyyy')}
          </Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 2 }}>Product</DataTable.Title>
              <DataTable.Title numeric>Δ</DataTable.Title>
              <DataTable.Title style={{ flex: 1.4 }}>User</DataTable.Title>
              <DataTable.Title style={{ flex: 1 }}>Date</DataTable.Title>
            </DataTable.Header>
            {history.slice(0, 80).map((m) => {
              const p = products.find((x) => x.id === m.product_id);
              return (
                <DataTable.Row key={m.id}>
                  <DataTable.Cell style={{ flex: 2 }}>{p?.sku ?? 'deleted'}</DataTable.Cell>
                  <DataTable.Cell numeric>{`${m.quantity_change > 0 ? '+' : ''}${m.quantity_change}`}</DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.4 }}>{userName(profiles, m.user_id)}</DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>{format(new Date(m.created_at), 'd MMM')}</DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </>
      ) : null}

      {report === 'dead' ? (
        <>
          <View style={styles.filterRow}>
            {DEAD_RANGES.map((d) => (
              <Chip key={d} compact selected={deadDays === d} onPress={() => setDeadDays(d)}>
                No movement in {d}d
              </Chip>
            ))}
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {dead.length} product{dead.length === 1 ? '' : 's'} with stock but no movement in {deadDays} days
          </Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 2 }}>Product</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2 }}>Last move</DataTable.Title>
            </DataTable.Header>
            {dead.slice(0, 60).map((r) => (
              <DataTable.Row key={r.product.id}>
                <DataTable.Cell style={{ flex: 2 }}>{r.product.name}</DataTable.Cell>
                <DataTable.Cell numeric>{r.product.quantity}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  {r.last ? format(new Date(r.last), 'd MMM yyyy') : 'never'}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </>
      ) : null}

      <Button mode="contained" icon="file-delimited-outline" onPress={exportCsv} style={{ marginTop: 12 }}>
        Export CSV
      </Button>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 64 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
