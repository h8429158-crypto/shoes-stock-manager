import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { COLORS, formatMoney } from '../theme';

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(key) {
  const today = dayKey(new Date());
  const yest = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return 'Today';
  if (key === yest) return 'Yesterday';
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SalesScreen() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      orderBy('soldAt', 'desc'),
      limit(500)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        Alert.alert('Could not load sales', err.message);
      }
    );
    return unsub;
  }, []);

  const { sections, todayTotal, allTotal, allProfit } = useMemo(() => {
    const groups = {};
    let todayTotal = 0;
    let allTotal = 0;
    let allProfit = 0;
    const today = dayKey(new Date());

    for (const s of sales) {
      const when = s.soldAt?.toDate ? s.soldAt.toDate() : new Date();
      const key = dayKey(when);
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...s, when });
      allTotal += Number(s.amount) || 0;
      allProfit += Number(s.profit) || 0;
      if (key === today) todayTotal += Number(s.amount) || 0;
    }

    const sections = Object.keys(groups)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((key) => {
        const data = groups[key];
        const total = data.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        return { title: dayLabel(key), total, data };
      });

    return { sections, todayTotal, allTotal, allProfit };
  }, [sales]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryTile, styles.summaryHighlight]}>
          <Text style={[styles.summaryValue, { color: '#fff' }]}>
            {formatMoney(todayTotal)}
          </Text>
          <Text style={[styles.summaryLabel, { color: '#cddcf2' }]}>
            Sold today
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{formatMoney(allTotal)}</Text>
          <Text style={styles.summaryLabel}>All sales</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {formatMoney(allProfit)}
          </Text>
          <Text style={styles.summaryLabel}>Total profit</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 44 }}>🧾</Text>
            <Text style={styles.emptyTitle}>No sales yet</Text>
            <Text style={styles.emptyText}>
              Open a shoe and tap the − button to record a sold carton.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatMoney(section.total)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.saleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleName} numberOfLines={1}>
                {item.name}
                {item.articleNo ? ` · ${item.articleNo}` : ''}
              </Text>
              <Text style={styles.saleSub}>
                {item.cartons} carton · {item.pairs} pairs
                {item.soldBy ? ` · ${item.soldBy}` : ''}
              </Text>
            </View>
            <Text style={styles.saleAmount}>{formatMoney(item.amount)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  summaryHighlight: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  summaryLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  sectionTotal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saleName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  saleSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
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
});
