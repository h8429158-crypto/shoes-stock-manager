import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { EmptyState } from '@/components/empty-state';
import { ProductForm } from '@/components/product-form';
import { useDataStore } from '@/store/data';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useDataStore((s) => s.products.find((p) => p.id === id));

  if (!product) {
    return <EmptyState icon="alert-circle-outline" title="Product not found" />;
  }
  return <ProductForm existing={product} />;
}
