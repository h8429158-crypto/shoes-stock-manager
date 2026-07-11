import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { statusColors } from '@/lib/theme';
import { stockStatus, type Product } from '@/lib/types';

const LABELS = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
} as const;

export function StockStatusChip({ product }: { product: Pick<Product, 'quantity' | 'reorder_level'> }) {
  const status = stockStatus(product);
  const color = statusColors[status];
  return (
    <View style={[styles.chip, { backgroundColor: color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="labelSmall" style={{ color }}>
        {LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
