import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { COLORS, formatMoney, LOW_STOCK_CARTONS } from '../theme';
import { totalPairs, stockCost, summarize, matchesSearch } from '../shoeUtils';

function StatTile({ label, value, highlight }) {
  return (
    <View style={[styles.statTile, highlight && styles.statTileHighlight]}>
      <Text style={[styles.statValue, highlight && { color: '#fff' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, highlight && { color: '#cddcf2' }]}>
        {label}
      </Text>
    </View>
  );
}

function ShoeCard({ shoe, onPress }) {
  const pairs = totalPairs(shoe);
  const lowStock = Number(shoe.cartons) <= LOW_STOCK_CARTONS;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {shoe.photo ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${shoe.photo}` }}
          style={styles.cardImage}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={{ fontSize: 30 }}>👟</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {shoe.name}
        </Text>
        {shoe.articleNo ? (
          <Text style={styles.cardSub} numberOfLines={1}>
            Art. {shoe.articleNo}
            {shoe.brand ? ` · ${shoe.brand}` : ''}
          </Text>
        ) : shoe.brand ? (
          <Text style={styles.cardSub}>{shoe.brand}</Text>
        ) : null}

        <View style={styles.cardRow}>
          <Text style={[styles.badge, lowStock && styles.badgeLow]}>
            {shoe.cartons} carton{Number(shoe.cartons) === 1 ? '' : 's'}
            {lowStock ? ' · LOW' : ''}
          </Text>
          <Text style={styles.badge}>{pairs} pairs</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardPrice}>
            Sell {formatMoney(shoe.sellingPrice)}
          </Text>
          {shoe.location ? (
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {shoe.location}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InventoryScreen({ navigation }) {
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'shoes'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setShoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        Alert.alert(
          'Could not load stock',
          'Please check your internet connection and the Firestore rules from the README.\n\n' + err.message
        );
      }
    );
    return unsub;
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Sign out', 'Do you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
            ])
          }
        >
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const filtered = useMemo(
    () => shoes.filter((s) => matchesSearch(s, search)),
    [shoes, search]
  );
  const totals = useMemo(() => summarize(shoes), [shoes]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <StatTile
                label="Stock value (cost)"
                value={formatMoney(totals.cost)}
                highlight
              />
              <StatTile label="Total pairs" value={String(totals.pairs)} />
            </View>
            <View style={styles.statsRow}>
              <StatTile label="Cartons" value={String(totals.cartons)} />
              <StatTile label="Articles" value={String(totals.articles)} />
              <StatTile
                label="Sale value"
                value={formatMoney(totals.saleValue)}
              />
            </View>

            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="🔍  Search name, article no., place, colour…"
              placeholderTextColor={COLORS.textLight}
            />

            {!loading && shoes.length > 0 && filtered.length === 0 ? (
              <Text style={styles.emptyText}>
                Nothing matches your search.
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 40 }}
            />
          ) : shoes.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44 }}>📦</Text>
              <Text style={styles.emptyTitle}>No shoes in stock yet</Text>
              <Text style={styles.emptyText}>
                Tap the orange button below to add your first shoes.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ShoeCard
            shoe={item}
            onPress={() => navigation.navigate('ShoeDetail', { shoeId: item.id })}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditShoe')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>＋ Add Shoes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  signOut: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 8,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statTileHighlight: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  search: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
  },
  cardImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeLow: { backgroundColor: '#fdecea', color: COLORS.danger },
  cardPrice: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  cardLocation: { fontSize: 12, color: COLORS.textLight, flexShrink: 1 },
  empty: { alignItems: 'center', marginTop: 50, paddingHorizontal: 30 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
