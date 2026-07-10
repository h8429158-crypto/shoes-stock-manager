import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import CalendarGrid from '../components/CalendarGrid';
import { colors, spacing, font, radius } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { indexCompletions, dayStatus } from '../logic/dayStatus';
import {
  currentMonthKey,
  shiftMonthKey,
  formatMonthKey,
  todayStr,
  datesInMonth,
} from '../logic/dates';

const LEGEND = [
  { color: colors.green, label: 'All done' },
  { color: colors.yellow, label: 'Partial' },
  { color: colors.red, label: 'Missed' },
];

export default function HistoryScreen() {
  const { tasks, completions, priorityCategory } = useApp();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const today = todayStr();

  const byDate = useMemo(() => indexCompletions(completions), [completions]);

  const statusFor = (dateStr) => {
    if (dateStr > today) return 'future';
    return dayStatus(tasks, byDate, dateStr, priorityCategory).status;
  };

  // Month roll-up counts.
  const counts = useMemo(() => {
    const acc = { green: 0, yellow: 0, red: 0 };
    for (const d of datesInMonth(monthKey)) {
      if (d > today) continue;
      const s = dayStatus(tasks, byDate, d, priorityCategory).status;
      if (acc[s] != null) acc[s] += 1;
    }
    return acc;
  }, [monthKey, tasks, byDate, priorityCategory, today]);

  const canGoNext = monthKey < currentMonthKey();

  return (
    <Screen title="History" subtitle="Your daily consistency">
      <Card>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => setMonthKey((m) => shiftMonthKey(m, -1))}
            style={styles.navBtn}
            hitSlop={10}
          >
            <Text style={styles.navText}>‹</Text>
          </Pressable>
          <Text style={styles.monthText}>{formatMonthKey(monthKey)}</Text>
          <Pressable
            onPress={() => canGoNext && setMonthKey((m) => shiftMonthKey(m, 1))}
            style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
            hitSlop={10}
            disabled={!canGoNext}
          >
            <Text style={[styles.navText, !canGoNext && styles.navTextDisabled]}>›</Text>
          </Pressable>
        </View>

        <CalendarGrid monthKey={monthKey} statusFor={statusFor} today={today} />

        <View style={styles.legend}>
          {LEGEND.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <Text style={[styles.summaryValue, { color: colors.green }]}>{counts.green}</Text>
          <Text style={styles.summaryLabel}>Perfect days</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={[styles.summaryValue, { color: colors.yellow }]}>{counts.yellow}</Text>
          <Text style={styles.summaryLabel}>Partial days</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={[styles.summaryValue, { color: colors.red }]}>{counts.red}</Text>
          <Text style={styles.summaryLabel}>Missed days</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  navBtnDisabled: { opacity: 0.3 },
  navText: { color: colors.text, fontSize: 26, fontWeight: '800', lineHeight: 28 },
  navTextDisabled: { color: colors.textFaint },
  monthText: { color: colors.text, fontSize: font.lg, fontWeight: '800' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 3, marginRight: 6 },
  legendText: { color: colors.textDim, fontSize: font.xs },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  summaryValue: { fontSize: font.xl, fontWeight: '800' },
  summaryLabel: { color: colors.textDim, fontSize: font.xs, marginTop: 2 },
});
