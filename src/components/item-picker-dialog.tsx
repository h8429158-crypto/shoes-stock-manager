import React, { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { Dialog, List, Portal, Searchbar, Text } from 'react-native-paper';

import type { Product } from '@/lib/types';
import { useDataStore } from '@/store/data';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onPick: (product: Product) => void;
  /** hide products already added */
  excludeIds?: string[];
}

export function ItemPickerDialog({ visible, onDismiss, onPick, excludeIds = [] }: Props) {
  const products = useDataStore((s) => s.products);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !p.archived && !excludeIds.includes(p.id))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? '').includes(q)
      )
      .slice(0, 30);
  }, [products, query, excludeIds]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '80%' }}>
        <Dialog.Title>Add item</Dialog.Title>
        <Dialog.Content>
          <Searchbar placeholder="Search name, SKU, barcode" value={query} onChangeText={setQuery} />
        </Dialog.Content>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={`${item.sku} · ${item.quantity} on hand`}
                onPress={() => {
                  onPick(item);
                  setQuery('');
                }}
              />
            )}
            ListEmptyComponent={<Text style={{ padding: 16, textAlign: 'center' }}>No products found</Text>}
            style={{ maxHeight: 320 }}
            keyboardShouldPersistTaps="handled"
          />
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  );
}
