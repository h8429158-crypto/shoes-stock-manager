import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS, formatMoney, LOW_STOCK_CARTONS } from '../theme';
import { totalPairs, stockCost, stockSaleValue } from '../shoeUtils';
import { sellOneCarton } from '../sales';

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ShoeDetailScreen({ navigation, route }) {
  const { shoeId } = route.params;
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'shoes', shoeId), (snap) => {
      if (snap.exists()) {
        setShoe({ id: snap.id, ...snap.data() });
      } else {
        // Deleted (possibly by another account) — go back to the list.
        setShoe(null);
        navigation.goBack();
      }
      setLoading(false);
    });
    return unsub;
  }, [shoeId, navigation]);

  if (loading || !shoe) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const pairs = totalPairs(shoe);
  const lowStock = Number(shoe.cartons) <= LOW_STOCK_CARTONS;

  const restock = async () => {
    try {
      await updateDoc(doc(db, 'shoes', shoe.id), {
        cartons: Number(shoe.cartons) + 1,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || '',
      });
    } catch (e) {
      Alert.alert('Could not update', 'Please check your internet connection and try again.');
    }
  };

  const sell = () => {
    if (Number(shoe.cartons) <= 0) {
      Alert.alert('Out of stock', 'There are no cartons left to sell.');
      return;
    }
    const amount = totalPairs({ ...shoe, cartons: 1 }) * Number(shoe.sellingPrice || 0);
    Alert.alert(
      'Sell one carton?',
      `Sell 1 carton (${shoe.pairsPerCarton} pairs)` +
        (amount ? ` for ${formatMoney(amount)}` : '') +
        '?\nThis is recorded in Sales.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          onPress: async () => {
            try {
              await sellOneCarton(shoe);
            } catch (e) {
              Alert.alert('Could not record sale', 'Please check your internet connection and try again.');
            }
          },
        },
      ]
    );
  };

  const remove = () => {
    Alert.alert(
      'Delete this shoe?',
      `"${shoe.name}" will be removed from stock for everyone. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'shoes', shoe.id));
            } catch (e) {
              Alert.alert('Could not delete', 'Please check your internet connection and try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {shoe.photo ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${shoe.photo}` }}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={{ fontSize: 56 }}>👟</Text>
        </View>
      )}

      <Text style={styles.title}>{shoe.name}</Text>
      {shoe.articleNo || shoe.brand ? (
        <Text style={styles.subtitle}>
          {[shoe.articleNo ? `Art. ${shoe.articleNo}` : null, shoe.brand]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}

      {lowStock ? (
        <View style={styles.lowStock}>
          <Text style={styles.lowStockText}>
            ⚠️ Low stock — only {shoe.cartons} carton
            {Number(shoe.cartons) === 1 ? '' : 's'} left
          </Text>
        </View>
      ) : null}

      {/* Quick carton adjust */}
      <View style={styles.adjustCard}>
        <Text style={styles.adjustLabel}>Cartons in stock</Text>
        <View style={styles.adjustRow}>
          <TouchableOpacity style={[styles.adjustBtn, styles.sellBtn]} onPress={sell}>
            <Text style={styles.adjustBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.adjustValue}>{shoe.cartons}</Text>
          <TouchableOpacity style={styles.adjustBtn} onPress={restock}>
            <Text style={styles.adjustBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.adjustHint}>
          Tap − to sell 1 carton (saved in Sales), ＋ when new stock arrives.
          Everyone sees it instantly.
        </Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Pairs in 1 carton" value={String(shoe.pairsPerCarton)} />
        <InfoRow label="Total pairs" value={String(pairs)} />
        <InfoRow
          label="Colour"
          value={
            shoe.colorType === 'mixed'
              ? `Mixed${shoe.colors ? ` (${shoe.colors})` : ''}`
              : shoe.colors || 'Single colour'
          }
        />
        <InfoRow label="Sizes in 1 carton" value={shoe.sizes} />
        <InfoRow label="Stocked at" value={shoe.location} />
        <InfoRow label="Notes" value={shoe.notes} />
      </View>

      <View style={styles.card}>
        <InfoRow label="Cost price (per pair)" value={formatMoney(shoe.costPrice)} />
        <InfoRow
          label="Selling price (per pair)"
          value={shoe.sellingPrice ? formatMoney(shoe.sellingPrice) : ''}
        />
        <InfoRow label="Total stock cost" value={formatMoney(stockCost(shoe))} />
        {shoe.sellingPrice ? (
          <>
            <InfoRow label="Total sale value" value={formatMoney(stockSaleValue(shoe))} />
            <InfoRow
              label="Expected profit"
              value={formatMoney(stockSaleValue(shoe) - stockCost(shoe))}
            />
          </>
        ) : null}
      </View>

      {shoe.updatedBy ? (
        <Text style={styles.updatedBy}>Last updated by {shoe.updatedBy}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('AddEditShoe', { shoe })}
      >
        <Text style={styles.editText}>✏️ Edit Details</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={remove}>
        <Text style={styles.deleteText}>Delete from stock</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  container: { padding: 16, paddingBottom: 40 },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 18,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 14,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 3,
  },
  lowStock: {
    backgroundColor: '#fdecea',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  lowStockText: {
    color: COLORS.danger,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  adjustCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
  },
  adjustLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 22,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellBtn: { backgroundColor: COLORS.accent },
  adjustBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },
  adjustValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
  },
  adjustHint: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  infoLabel: { fontSize: 14, color: COLORS.textLight, flexShrink: 0 },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  updatedBy: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  editText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { alignItems: 'center', marginTop: 14, padding: 8 },
  deleteText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
});
