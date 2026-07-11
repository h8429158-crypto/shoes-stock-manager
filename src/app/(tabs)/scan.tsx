import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, Dialog, Divider, List, Portal, Switch, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import type { Product } from '@/lib/types';
import { useDataStore } from '@/store/data';
import { useStocktakeStore } from '@/store/stocktake';

const SCAN_COOLDOWN_MS = 1600;

export default function ScanScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const products = useDataStore((s) => s.products);
  const stocktake = useStocktakeStore();

  const [focused, setFocused] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [hit, setHit] = useState<Product | null>(null);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{ name: string; count: number } | null>(null);
  const lastScanAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const dialogOpen = hit !== null || unknownCode !== null;

  const onBarcode = (result: BarcodeScanningResult) => {
    const nowMs = Date.now();
    if (dialogOpen || nowMs - lastScanAt.current < SCAN_COOLDOWN_MS) return;
    lastScanAt.current = nowMs;

    const code = result.data.trim();
    if (!code) return;
    const product = products.find((p) => (p.barcode ?? '').trim() === code && !p.archived);

    if (!product) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setUnknownCode(code);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (continuous) {
      stocktake.addScan(product.id);
      const count = (useStocktakeStore.getState().counts[product.id] ?? 0);
      setLastScan({ name: product.name, count });
    } else {
      setHit(product);
    }
  };

  const closeDialogs = () => {
    setHit(null);
    setUnknownCode(null);
  };

  const go = (fn: () => void) => {
    closeDialogs();
    fn();
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <EmptyState
          icon="camera-off-outline"
          title="Camera access needed"
          message="StockRoom uses the camera to scan product barcodes."
          actionLabel="Allow camera"
          onAction={() => void requestPermission()}
        />
      </SafeAreaView>
    );
  }

  const countedItems = Object.entries(stocktake.counts);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {focused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={onBarcode}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr', 'itf14', 'codabar'],
          }}
        />
      ) : null}

      {/* Viewfinder */}
      <View pointerEvents="none" style={styles.viewfinderWrap}>
        <View style={styles.viewfinder} />
        <Text style={styles.hint}>
          {continuous ? 'Counting mode: each scan adds 1' : 'Point at a barcode'}
        </Text>
      </View>

      {/* Top bar: continuous toggle */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.toggleRow}>
          <MaterialCommunityIcons name="counter" size={18} color="#fff" />
          <Text style={styles.toggleLabel}>Continuous count</Text>
          <Switch
            value={continuous}
            onValueChange={(v) => {
              setContinuous(v);
              setLastScan(null);
              if (v && !stocktake.active) stocktake.start();
            }}
          />
        </View>
      </SafeAreaView>

      {/* Bottom sheet-ish area */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {continuous ? (
          <View style={[styles.countPanel, { backgroundColor: theme.colors.surface }]}>
            {lastScan ? (
              <Text variant="bodyMedium" numberOfLines={1}>
                ✓ {lastScan.name} — counted {lastScan.count}
              </Text>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Scan items to count them
              </Text>
            )}
            <View style={styles.countActions}>
              <View style={{ position: 'relative' }}>
                <Button
                  mode="contained"
                  icon="clipboard-check-outline"
                  disabled={countedItems.length === 0}
                  onPress={() => router.push('/stocktake')}
                >
                  Review & apply
                </Button>
                {countedItems.length > 0 ? (
                  <Badge style={styles.badge}>{countedItems.length}</Badge>
                ) : null}
              </View>
              <Button mode="text" onPress={() => stocktake.clear()} disabled={countedItems.length === 0}>
                Reset
              </Button>
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      {/* Product found → action sheet */}
      <Portal>
        <Dialog visible={hit !== null} onDismiss={closeDialogs}>
          <Dialog.Title>{hit?.name}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {hit?.sku} · {hit?.quantity} {hit?.unit} on hand
            </Text>
          </Dialog.Content>
          <View>
            <Divider />
            <List.Item
              title="Stock in"
              left={(p) => <List.Icon {...p} icon="tray-arrow-down" />}
              onPress={() => go(() => router.push({ pathname: '/stock-op', params: { productId: hit!.id, type: 'in' } }))}
            />
            <List.Item
              title="Stock out"
              left={(p) => <List.Icon {...p} icon="tray-arrow-up" />}
              onPress={() => go(() => router.push({ pathname: '/stock-op', params: { productId: hit!.id, type: 'out' } }))}
            />
            <List.Item
              title="Add to purchase order"
              left={(p) => <List.Icon {...p} icon="clipboard-plus-outline" />}
              onPress={() => go(() => router.push({ pathname: '/po/new', params: { productId: hit!.id } }))}
            />
            <List.Item
              title="Details"
              left={(p) => <List.Icon {...p} icon="information-outline" />}
              onPress={() => go(() => router.push({ pathname: '/product/[id]', params: { id: hit!.id } }))}
            />
          </View>
          <Dialog.Actions>
            <Button onPress={closeDialogs}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Unknown barcode */}
        <Dialog visible={unknownCode !== null} onDismiss={closeDialogs}>
          <Dialog.Title>No product found</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              No product matches barcode {unknownCode}. Create a new product with this barcode?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialogs}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => go(() => router.push({ pathname: '/product/new', params: { barcode: unknownCode! } }))}
            >
              Create product
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  viewfinderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  viewfinder: {
    width: 250,
    height: 160,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
  },
  hint: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  toggleLabel: { color: '#fff', fontSize: 13 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  countPanel: { margin: 12, borderRadius: 16, padding: 14, gap: 10 },
  countActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { position: 'absolute', top: -6, right: -6 },
});
