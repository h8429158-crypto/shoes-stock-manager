import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ProductForm } from '@/components/product-form';

export default function NewProductScreen() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  return <ProductForm initialBarcode={typeof barcode === 'string' ? barcode : undefined} />;
}
