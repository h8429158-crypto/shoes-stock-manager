import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { QuantityStepper } from '@/components/quantity-stepper';
import { StockStatusChip } from '@/components/stock-status-chip';
import { recordMovement } from '@/db/mutations';
import type { MovementReason } from '@/lib/types';
import { stockOpSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';

const REASONS: Record<'in' | 'out', { value: MovementReason; label: string; icon: string }[]> = {
  in: [
    { value: 'purchase', label: 'Purchase', icon: 'cart-arrow-down' },
    { value: 'return', label: 'Return', icon: 'backup-restore' },
    { value: 'adjustment', label: 'Adjustment', icon: 'tune' },
  ],
  out: [
    { value: 'sale', label: 'Sale', icon: 'cash-register' },
    { value: 'damage', label: 'Damage', icon: 'alert-octagon-outline' },
    { value: 'return', label: 'Return to supplier', icon: 'truck-outline' },
    { value: 'adjustment', label: 'Adjustment', icon: 'tune' },
  ],
};

export default function StockOpScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ productId: string; type: string }>();
  const type = params.type === 'out' ? 'out' : 'in';
  const { activeOrgId, session } = useAuthStore();
  const product = useDataStore((s) => s.products.find((p) => p.id === params.productId));

  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<MovementReason>(type === 'in' ? 'purchase' : 'sale');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!product) {
    return <EmptyState icon="alert-circle-outline" title="Product not found" />;
  }

  const overdraw = type === 'out' && quantity > product.quantity;

  const submit = () => {
    if (!activeOrgId || !session) return;
    const parsed = stockOpSchema.safeParse({ quantity, reason, note });
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    recordMovement({
      orgId: activeOrgId,
      userId: session.user.id,
      product,
      type,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      note: parsed.data.note,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: type === 'in' ? 'Stock in' : 'Stock out' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.productHeader}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              {product.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {product.sku} · {product.quantity} {product.unit} on hand
            </Text>
            <StockStatusChip product={product} />
          </View>

          <Text variant="labelLarge" style={styles.label}>
            Quantity
          </Text>
          <QuantityStepper value={quantity} onChange={setQuantity} />
          {errors.quantity ? <HelperText type="error">{errors.quantity}</HelperText> : null}
          {overdraw ? (
            <HelperText type="info">
              Only {product.quantity} on hand — stock can&apos;t go below zero; the movement will be
              capped on the server.
            </HelperText>
          ) : null}

          <Text variant="labelLarge" style={styles.label}>
            Reason
          </Text>
          <View style={styles.reasonRow}>
            {REASONS[type].map((r) => (
              <Chip
                key={r.value}
                icon={r.icon}
                selected={reason === r.value}
                onPress={() => setReason(r.value)}
                showSelectedCheck={false}
                mode={reason === r.value ? 'flat' : 'outlined'}
              >
                {r.label}
              </Chip>
            ))}
          </View>

          <TextInput label="Note (optional)" value={note} onChangeText={setNote} multiline style={{ marginTop: 12 }} />

          <Button mode="contained" style={styles.submit} onPress={submit} icon={type === 'in' ? 'tray-arrow-down' : 'tray-arrow-up'}>
            {type === 'in' ? `Stock in ${quantity}` : `Stock out ${quantity}`}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
  productHeader: { alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { marginTop: 16, marginBottom: 6 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  submit: { marginTop: 24 },
});
