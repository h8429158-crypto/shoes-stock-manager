import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, IconButton, Menu, Text, TextInput, useTheme } from 'react-native-paper';

import { ItemPickerDialog } from '@/components/item-picker-dialog';
import { createPurchaseOrder } from '@/db/mutations';
import { localDocNumber } from '@/lib/ids';
import { centsToInput, formatMoney, parseMoney } from '@/lib/money';
import { stockStatus, suggestedReorderQty, type Product } from '@/lib/types';
import { poSchema, zodErrors } from '@/lib/validation';
import { useActiveOrg, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';

interface Line {
  product: Product;
  quantity: string;
  unitCost: string;
}

export default function NewPoScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ productId?: string; supplierId?: string }>();
  const org = useActiveOrg();
  const { activeOrgId, session } = useAuthStore();
  const { products, suppliers } = useDataStore();

  const initialProduct = products.find((p) => p.id === params.productId);
  const [supplierId, setSupplierId] = useState<string | null>(
    (typeof params.supplierId === 'string' ? params.supplierId : null) ?? initialProduct?.supplier_id ?? null
  );
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>(
    initialProduct
      ? [{ product: initialProduct, quantity: String(suggestedReorderQty(initialProduct)), unitCost: centsToInput(initialProduct.cost_price) }]
      : []
  );
  const [supMenu, setSupMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currency = org?.currency ?? 'USD';
  const supplier = suppliers.find((s) => s.id === supplierId);

  const lowStockForSupplier = useMemo(
    () =>
      products.filter(
        (p) =>
          !p.archived &&
          stockStatus(p) !== 'in_stock' &&
          (!supplierId || p.supplier_id === supplierId) &&
          !lines.some((l) => l.product.id === p.id)
      ),
    [products, supplierId, lines]
  );

  const addProduct = (product: Product) => {
    setLines((ls) => [
      ...ls,
      { product, quantity: String(suggestedReorderQty(product)), unitCost: centsToInput(product.cost_price) },
    ]);
    setPicker(false);
    if (!supplierId && product.supplier_id) setSupplierId(product.supplier_id);
  };

  const addAllLowStock = () => {
    setLines((ls) => [
      ...ls,
      ...lowStockForSupplier.map((p) => ({
        product: p,
        quantity: String(suggestedReorderQty(p)),
        unitCost: centsToInput(p.cost_price),
      })),
    ]);
  };

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const total = lines.reduce((sum, l) => {
    const q = parseInt(l.quantity, 10) || 0;
    const c = parseMoney(l.unitCost);
    return sum + q * (Number.isFinite(c) ? c : 0);
  }, 0);

  const save = (status: 'draft' | 'sent') => {
    if (!activeOrgId || !session) return;
    const items = lines.map((l) => ({
      productId: l.product.id,
      quantity: parseInt(l.quantity, 10) || 0,
      unitCost: Number.isFinite(parseMoney(l.unitCost)) ? parseMoney(l.unitCost) : 0,
    }));
    const parsed = poSchema.safeParse({ supplierId: supplierId ?? '', expectedDate, notes, items });
    const errs = zodErrors(parsed);
    if (items.some((i) => i.quantity <= 0)) errs.items = 'Every line needs a quantity of at least 1';
    setErrors(errs);
    if (!parsed.success || errs.items) return;

    const po = createPurchaseOrder(
      activeOrgId,
      session.user.id,
      localDocNumber('PO'),
      {
        supplierId: parsed.data.supplierId,
        expectedDate: parsed.data.expectedDate || null,
        notes: parsed.data.notes,
        items,
      },
      status
    );
    router.replace({ pathname: '/po/[id]', params: { id: po.id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Menu
          visible={supMenu}
          onDismiss={() => setSupMenu(false)}
          anchor={
            <Button mode="outlined" icon="truck-outline" onPress={() => setSupMenu(true)}>
              {supplier?.name ?? 'Pick supplier *'}
            </Button>
          }
        >
          {suppliers.map((s) => (
            <Menu.Item key={s.id} title={s.name} onPress={() => { setSupplierId(s.id); setSupMenu(false); }} />
          ))}
        </Menu>
        {errors.supplierId ? <HelperText type="error">{errors.supplierId}</HelperText> : null}

        <TextInput
          label="Expected date (YYYY-MM-DD)"
          value={expectedDate}
          onChangeText={setExpectedDate}
          placeholder="2026-07-20"
          error={!!errors.expectedDate}
        />
        {errors.expectedDate ? <HelperText type="error">{errors.expectedDate}</HelperText> : null}

        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />

        <Divider style={{ marginVertical: 8 }} />
        <View style={styles.itemsHeader}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Line items
          </Text>
          <Button icon="plus" onPress={() => setPicker(true)} compact>
            Add item
          </Button>
        </View>

        {lowStockForSupplier.length > 0 ? (
          <Button mode="text" icon="lightning-bolt-outline" onPress={addAllLowStock} compact>
            Add {lowStockForSupplier.length} low-stock item{lowStockForSupplier.length === 1 ? '' : 's'}
            {supplier ? ` from ${supplier.name}` : ''}
          </Button>
        ) : null}

        {lines.map((line, idx) => (
          <View key={line.product.id} style={[styles.lineRow, { borderColor: theme.colors.outlineVariant }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '600' }}>
                {line.product.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {line.product.sku} · {line.product.quantity} on hand
              </Text>
            </View>
            <TextInput
              mode="outlined"
              dense
              label="Qty"
              keyboardType="number-pad"
              value={line.quantity}
              onChangeText={(t) => updateLine(idx, { quantity: t.replace(/[^0-9]/g, '') })}
              style={styles.qtyInput}
            />
            <TextInput
              mode="outlined"
              dense
              label="Cost"
              keyboardType="decimal-pad"
              value={line.unitCost}
              onChangeText={(t) => updateLine(idx, { unitCost: t })}
              style={styles.costInput}
            />
            <IconButton icon="close" size={18} onPress={() => setLines((ls) => ls.filter((_, i) => i !== idx))} />
          </View>
        ))}
        {errors.items ? <HelperText type="error">{errors.items}</HelperText> : null}

        <View style={styles.totalRow}>
          <Text variant="titleMedium">Total</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {formatMoney(total, currency)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" style={{ flex: 1 }} onPress={() => save('draft')}>
            Save draft
          </Button>
          <Button mode="contained" style={{ flex: 1 }} icon="send" onPress={() => save('sent')}>
            Save & mark sent
          </Button>
        </View>
      </ScrollView>

      <ItemPickerDialog
        visible={picker}
        onDismiss={() => setPicker(false)}
        onPick={addProduct}
        excludeIds={lines.map((l) => l.product.id)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  qtyInput: { width: 64 },
  costInput: { width: 84 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
