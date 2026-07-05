import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

import { StockStatusChip } from '@/components/stock-status-chip';
import { formatMoney } from '@/lib/money';
import type { Product } from '@/lib/types';

interface Props {
  product: Product;
  currency: string;
  canManage: boolean;
  onPress: () => void;
  onStockIn: () => void;
  onStockOut: () => void;
  onDelete: () => void;
}

export function ProductListItem({ product, currency, canManage, onPress, onStockIn, onStockOut, onDelete }: Props) {
  const theme = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  const act = (fn: () => void) => () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      <Pressable style={[styles.action, { backgroundColor: '#16A34A' }]} onPress={act(onStockIn)}>
        <MaterialCommunityIcons name="tray-arrow-down" size={22} color="#fff" />
        <Text style={styles.actionLabel}>In</Text>
      </Pressable>
      <Pressable style={[styles.action, { backgroundColor: '#D97706' }]} onPress={act(onStockOut)}>
        <MaterialCommunityIcons name="tray-arrow-up" size={22} color="#fff" />
        <Text style={styles.actionLabel}>Out</Text>
      </Pressable>
      {canManage ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.error }]} onPress={act(onDelete)}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Delete</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ReanimatedSwipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPress={onPress}
        style={[styles.row, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}
      >
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="shoe-sneaker" size={22} color={theme.colors.onSurfaceVariant} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyLarge" numberOfLines={1} style={{ fontWeight: '600' }}>
            {product.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {product.sku}
            {product.barcode ? `  ·  ${product.barcode}` : ''}
          </Text>
          <StockStatusChip product={product} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {product.quantity}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {product.unit}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatMoney(product.selling_price, currency)}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row' },
  action: { width: 72, alignItems: 'center', justifyContent: 'center', gap: 2 },
  actionLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
