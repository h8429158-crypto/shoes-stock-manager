import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Screen, { SectionTitle } from '../components/Screen';
import Card from '../components/Card';
import BarChart from '../components/BarChart';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, font, categoryColors } from '../theme/theme';
import { useApp } from '../state/AppContext';
import {
  dailyPoints,
  monthlyPoints,
  categoryBreakdown,
  totalEarned,
  shortWeekday,
} from '../logic/stats';
import { todayStr, currentMonthKey } from '../logic/dates';

export default function StatsScreen() {
  const { completions, tasks, summary } = useApp();
  const today = todayStr();
  const monthKey = currentMonthKey();

  const weekly = useMemo(
    () =>
      dailyPoints(completions, today, 7).map((d) => ({
        label: shortWeekday(d.date),
        value: d.points,
      })),
    [completions, today],
  );

  const monthly = useMemo(
    () =>
      monthlyPoints(completions, monthKey, 6).map((m) => ({
        label: m.label.slice(0, 3),
        value: m.points,
      })),
    [completions, monthKey],
  );

  const breakdown = useMemo(
    () => categoryBreakdown(completions, tasks, monthKey),
    [completions, tasks, monthKey],
  );
  const breakdownMax = Math.max(1, ...breakdown.map((b) => b.points));
  const lifetime = useMemo(() => totalEarned(completions), [completions]);

  return (
    <Screen title="Stats" subtitle="Points & consistency">
      <View style={styles.topRow}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{summary.totalPoints}</Text>
          <Text style={styles.tileLabel}>Points this month</Text>
        </View>
        <View style={styles.tile}>
          <Text style={[styles.tileValue, { color: colors.accent }]}>{lifetime}</Text>
          <Text style={styles.tileLabel}>Points all-time</Text>
        </View>
      </View>

      <SectionTitle>Last 7 days</SectionTitle>
      <Card>
        <BarChart data={weekly} barColor={colors.primary} />
      </Card>

      <SectionTitle>Last 6 months</SectionTitle>
      <Card>
        <BarChart data={monthly} barColor={colors.accent} />
      </Card>

      <SectionTitle>This month by category</SectionTitle>
      <Card>
        {breakdown.every((b) => b.points === 0) ? (
          <Text style={styles.empty}>No points earned yet this month.</Text>
        ) : (
          breakdown.map((b) => (
            <View key={b.category} style={styles.catRow}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{b.category}</Text>
                <Text style={styles.catPoints}>{b.points} pts</Text>
              </View>
              <ProgressBar
                ratio={b.points / breakdownMax}
                color={categoryColors[b.category]}
                height={10}
              />
            </View>
          ))
        )}
      </Card>

      {summary.bonus > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.bonusText}>
            🔥 Streak bonus this month: <Text style={styles.bonusValue}>+{summary.bonus} pts</Text>
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  tileValue: { color: colors.primary, fontSize: font.xxl, fontWeight: '900' },
  tileLabel: { color: colors.textDim, fontSize: font.xs, marginTop: 2 },
  catRow: { marginBottom: spacing.md },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { color: colors.text, fontSize: font.sm, fontWeight: '700' },
  catPoints: { color: colors.textDim, fontSize: font.sm, fontWeight: '700' },
  empty: { color: colors.textDim, fontSize: font.md },
  bonusText: { color: colors.text, fontSize: font.md },
  bonusValue: { color: colors.accent, fontWeight: '800' },
});
