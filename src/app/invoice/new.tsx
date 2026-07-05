import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';

import { ItemPickerDialog } from '@/components/item-picker-dialog';
import { createInvoice } from '@/db/mutations';
import { localDocNumber } from '@/lib/ids';
import { centsToInput, formatMoney, parseMoney } from '@/lib/money';
import type { Product } from '@/lib/types';
import { invoiceSchema, zodErrors } from '@/lib/validation';
import { useActiveOrg, useAuthStore } from '@/store/auth';

interface Line {
  product: Product;
  quantity: string;
  unitPrice: string;
}

export default function NewInvoiceScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const { activeOrgId, session } = useAuthStore();

  const [customerName, setCustomerName] = useState('');
  const [taxRate, setTaxRate] = useState(String(org?.tax_rate ?? 0));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [picker, setPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currency = org?.currency ?? 'USD';

  const addProduct = (product: Product) => {
    setLines((ls) => [...ls, { product, quantity: '1', unitPrice: centsToInput(product.selling_price) }]);
    setPicker(false);
  };

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const subtotal = lines.reduce((sum, l) => {
    const q = parseInt(l.quantity, 10) || 0;
    const p = parseMoney(l.unitPrice);
    return sum + q * (Number.isFinite(p) ? p : 0);
  }, 0);
  const taxNum = Number(taxRate) || 0;
  const total = Math.round(subtotal * (1 + taxNum / 100));

  const save = () => {
    if (!activeOrgId || !session) return;
    const items = lines.map((l) => ({
      productId: l.product.id,
      quantity: parseInt(l.quantity, 10) || 0,
      unitPrice: Number.isFinite(parseMoney(l.unitPrice)) ? parseMoney(l.unitPrice) : 0,
    }));
    const parsed = invoiceSchema.safeParse({ customerName, taxRate, notes, items });
    const errs = zodErrors(parsed);
    if (items.some((i) => i.quantity <= 0)) errs.items = 'Every line needs a quantity of at least 1';
    const short = lines.find((l) => (parseInt(l.quantity, 10) || 0) > l.product.quantity);
    if (short) errs.items = `Only ${short.product.quantity} of "${short.product.name}" in stock`;
    setErrors(errs);
    if (!parsed.success || errs.items) return;

    const invoice = createInvoice(activeOrgId, session.user.id, localDocNumber('INV'), {
      customerName: parsed.data.customerName,
      taxRate: parsed.data.taxRate,
      notes: parsed.data.notes,
      items: items.map((i, idx) => ({ ...i, description: lines[idx].product.name })),
    });
    router.replace({ pathname: '/invoice/[id]', params: { id: invoice.id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput label="Customer name *" value={customerName} onChangeText={setCustomerName} error={!!errors.customerName} />
        {errors.customerName ? <HelperText type="error">{errors.customerName}</HelperText> : null}

        <TextInput label="Tax rate (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" error={!!errors.taxRate} />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />

        <Divider style={{ marginVertical: 8 }} />
        <View style={styles.itemsHeader}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Items
          </Text>
          <Button icon="plus" onPress={() => setPicker(true)} compact>
            Add item
          </Button>
        </View>
        <HelperText type="info" style={{ paddingHorizontal: 0 }}>
          Saving the invoice stocks out every item automatically.
        </HelperText>

        {lines.map((line, idx) => (
          <View key={line.product.id} style={[styles.lineRow, { borderColor: theme.colors.outlineVariant }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '600' }}>
                {line.product.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {line.product.quantity} in stock
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
              label="Price"
              keyboardType="decimal-pad"
              value={line.unitPrice}
              onChangeText={(t) => updateLine(idx, { unitPrice: t })}
              style={styles.priceInput}
            />
            <IconButton icon="close" size={18} onPress={() => setLines((ls) => ls.filter((_, i) => i !== idx))} />
          </View>
        ))}
        {errors.items ? <HelperText type="error">{errors.items}</HelperText> : null}

        <View style={styles.totalRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Subtotal {formatMoney(subtotal, currency)} · Tax {taxNum}%
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text variant="titleMedium">Total</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {formatMoney(total, currency)}
          </Text>
        </View>

        <Button mode="contained" icon="receipt" onPress={save} style={{ marginTop: 8 }}>
          Save invoice
        </Button>
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
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, padding: 8 },
  qtyInput: { width: 64 },
  priceInput: { width: 84 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
