import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Menu, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { createProduct, updateProduct, uploadImage } from '@/db/mutations';
import { nextSku } from '@/lib/ids';
import { centsToInput, parseMoney } from '@/lib/money';
import type { Product } from '@/lib/types';
import { productSchema, zodErrors } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';
import { useSyncStore } from '@/store/sync';

interface Props {
  existing?: Product;
  /** Prefill barcode when creating from the scanner. */
  initialBarcode?: string;
}

export function ProductForm({ existing, initialBarcode }: Props) {
  const theme = useTheme();
  const { activeOrgId, session } = useAuthStore();
  const { products, categories, suppliers } = useDataStore();
  const online = useSyncStore((s) => s.online);

  const [name, setName] = useState(existing?.name ?? '');
  const [sku, setSku] = useState(existing?.sku ?? nextSku(products));
  const [barcode, setBarcode] = useState(existing?.barcode ?? initialBarcode ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [supplierId, setSupplierId] = useState<string | null>(existing?.supplier_id ?? null);
  const [costPrice, setCostPrice] = useState(existing ? centsToInput(existing.cost_price) : '');
  const [sellingPrice, setSellingPrice] = useState(existing ? centsToInput(existing.selling_price) : '');
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '0');
  const [reorderLevel, setReorderLevel] = useState(existing ? String(existing.reorder_level) : '5');
  const [unit, setUnit] = useState(existing?.unit ?? 'pcs');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | null>(existing?.image_url ?? null);
  const [imageIsLocal, setImageIsLocal] = useState(false);

  const [catMenu, setCatMenu] = useState(false);
  const [supMenu, setSupMenu] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack(fromCamera ? 'Camera permission is needed to take a photo.' : 'Photo library permission is needed.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageIsLocal(true);
    }
  };

  const choosePhoto = () => {
    Alert.alert('Product photo', undefined, [
      { text: 'Take photo', onPress: () => void pickImage(true) },
      { text: 'Choose from library', onPress: () => void pickImage(false) },
      ...(imageUri ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => { setImageUri(null); setImageIsLocal(false); } }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!activeOrgId || !session) return;

    const parsed = productSchema.safeParse({
      name, sku, barcode, categoryId, supplierId,
      costPrice, sellingPrice, quantity, reorderLevel, unit, notes,
    });
    const errs = zodErrors(parsed);

    const duplicateSku = products.some(
      (p) => p.sku.trim().toLowerCase() === sku.trim().toLowerCase() && p.id !== existing?.id
    );
    if (duplicateSku) errs.sku = 'A product with this SKU already exists';
    setErrors(errs);
    if (!parsed.success || duplicateSku) return;

    setSaving(true);
    try {
      // Upload the photo first when online; keep saving offline without it.
      let imageUrl = existing?.image_url ?? null;
      if (imageIsLocal && imageUri) {
        if (online) {
          try {
            imageUrl = await uploadImage(activeOrgId, imageUri);
          } catch {
            setSnack('Photo upload failed — product saved without the new photo.');
          }
        } else {
          setSnack('Offline: product saved without the new photo. Re-add it once online.');
        }
      } else if (imageUri === null) {
        imageUrl = null;
      }

      const fields = {
        name: parsed.data.name,
        sku: parsed.data.sku,
        barcode: parsed.data.barcode || null,
        category_id: parsed.data.categoryId,
        supplier_id: parsed.data.supplierId,
        cost_price: parsed.data.costPrice ? parseMoney(parsed.data.costPrice) : 0,
        selling_price: parsed.data.sellingPrice ? parseMoney(parsed.data.sellingPrice) : 0,
        reorder_level: parsed.data.reorderLevel ? Number(parsed.data.reorderLevel) : 0,
        unit: parsed.data.unit,
        notes: parsed.data.notes,
        image_url: imageUrl,
      };

      if (existing) {
        updateProduct(existing, fields);
      } else {
        createProduct(activeOrgId, session.user.id, {
          ...fields,
          initialQuantity: parsed.data.quantity ? Number(parsed.data.quantity) : 0,
        });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? 'No category';
  const supplierName = suppliers.find((s) => s.id === supplierId)?.name ?? 'No supplier';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={choosePhoto} style={styles.photoWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoEmpty, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="camera-plus-outline" size={30} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Add photo
              </Text>
            </View>
          )}
        </Pressable>

        <TextInput label="Name *" value={name} onChangeText={setName} error={!!errors.name} />
        {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="SKU *"
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
              error={!!errors.sku}
              right={<TextInput.Icon icon="refresh" onPress={() => setSku(nextSku(products))} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput label="Barcode" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" />
          </View>
        </View>
        {errors.sku ? <HelperText type="error">{errors.sku}</HelperText> : null}

        <View style={styles.row}>
          <Menu
            visible={catMenu}
            onDismiss={() => setCatMenu(false)}
            anchor={
              <Button mode="outlined" icon="tag-outline" onPress={() => setCatMenu(true)} style={{ flex: 1 }}>
                {categoryName}
              </Button>
            }
          >
            <Menu.Item title="No category" onPress={() => { setCategoryId(null); setCatMenu(false); }} />
            {categories.map((c) => (
              <Menu.Item key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setCatMenu(false); }} />
            ))}
          </Menu>
          <Menu
            visible={supMenu}
            onDismiss={() => setSupMenu(false)}
            anchor={
              <Button mode="outlined" icon="truck-outline" onPress={() => setSupMenu(true)} style={{ flex: 1 }}>
                {supplierName}
              </Button>
            }
          >
            <Menu.Item title="No supplier" onPress={() => { setSupplierId(null); setSupMenu(false); }} />
            {suppliers.map((s) => (
              <Menu.Item key={s.id} title={s.name} onPress={() => { setSupplierId(s.id); setSupMenu(false); }} />
            ))}
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextInput label="Cost price" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" error={!!errors.costPrice} />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput label="Selling price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" error={!!errors.sellingPrice} />
          </View>
        </View>
        {errors.costPrice || errors.sellingPrice ? (
          <HelperText type="error">{errors.costPrice ?? errors.sellingPrice}</HelperText>
        ) : null}

        <View style={styles.row}>
          {!existing ? (
            <View style={{ flex: 1 }}>
              <TextInput label="Initial quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" error={!!errors.quantity} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <TextInput label="Reorder level" value={reorderLevel} onChangeText={setReorderLevel} keyboardType="number-pad" error={!!errors.reorderLevel} />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput label="Unit" value={unit} onChangeText={setUnit} error={!!errors.unit} />
          </View>
        </View>
        {errors.quantity || errors.reorderLevel || errors.unit ? (
          <HelperText type="error">{errors.quantity ?? errors.reorderLevel ?? errors.unit}</HelperText>
        ) : null}
        {existing ? (
          <HelperText type="info">
            Quantity is changed via stock in/out or stocktake so every change stays on the audit log.
          </HelperText>
        ) : null}

        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        <Button mode="contained" onPress={save} loading={saving} disabled={saving} style={styles.saveButton}>
          {existing ? 'Save changes' : 'Add product'}
        </Button>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3500}>
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  photoWrap: { alignSelf: 'center' },
  photo: { width: 110, height: 110, borderRadius: 16 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  row: { flexDirection: 'row', gap: 10 },
  divider: { marginVertical: 4 },
  saveButton: { marginTop: 12 },
});
