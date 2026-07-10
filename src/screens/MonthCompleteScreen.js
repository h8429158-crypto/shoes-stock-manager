import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import StatTile from '../components/StatTile';
import { colors, spacing, font } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatRupees, formatPercent } from '../logic/rewards';
import { formatMonthKey } from '../logic/dates';

export default function MonthCompleteScreen({ navigation }) {
  const { summary, payouts, markMonthPaid, unmarkMonthPaid } = useApp();
  const payout = payouts.find((p) => p.month === summary.monthKey);
  const isPaid = !!(payout && payout.paid);

  const markPaid = () =>
    markMonthPaid(summary.monthKey, {
      amount: summary.reward,
      consistency: summary.consistency,
      points: summary.totalPoints,
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.flag}>🏁</Text>
        <Text style={styles.h1}>Month Complete</Text>
        <Text style={styles.month}>{formatMonthKey(summary.monthKey)}</Text>

        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>YOUR REWARD</Text>
          <Text style={styles.reward}>{formatRupees(summary.reward)}</Text>
          <Text style={styles.heroSub}>Pay this to yourself 🎉</Text>
          <View style={{ width: '100%', marginTop: spacing.lg }}>
            <ProgressBar ratio={summary.consistency} color={colors.primary} height={14} />
            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>₹10,000</Text>
              <Text style={styles.rangeText}>₹20,000</Text>
            </View>
          </View>
        </Card>

        <View style={styles.grid}>
          <StatTile
            label="Consistency"
            value={formatPercent(summary.consistency)}
            accent={colors.primary}
          />
          <StatTile label="Total points" value={summary.totalPoints} accent={colors.accent} />
        </View>
        <View style={styles.grid}>
          <StatTile
            label="Best streak"
            value={`${summary.bestStreak}d`}
            accent={colors.text}
          />
          <StatTile label="Streak bonus" value={`+${summary.bonus}`} accent={colors.accent} />
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.breakLabel}>Points breakdown</Text>
          <View style={styles.breakRow}>
            <Text style={styles.breakKey}>Earned from tasks</Text>
            <Text style={styles.breakVal}>{summary.monthEarned}</Text>
          </View>
          <View style={styles.breakRow}>
            <Text style={styles.breakKey}>Possible this month</Text>
            <Text style={styles.breakVal}>{summary.monthPossible}</Text>
          </View>
          <View style={styles.breakRow}>
            <Text style={styles.breakKey}>Streak bonus</Text>
            <Text style={styles.breakVal}>+{summary.bonus}</Text>
          </View>
        </Card>

        {isPaid ? (
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>
              ✓ Paid to yourself — {formatRupees(payout.amount)}
            </Text>
            <Text style={styles.paidUndo} onPress={() => unmarkMonthPaid(summary.monthKey)}>
              Undo
            </Text>
          </View>
        ) : (
          <Button
            title="✓ Mark as paid to myself"
            onPress={markPaid}
            style={{ marginTop: spacing.lg }}
          />
        )}

        <Text style={styles.note}>
          A new month starts fresh — points reset to zero and you can set a new
          priority. Your tasks carry over.
        </Text>

        <Button
          title="Done"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: 'center', paddingBottom: spacing.xxl },
  flag: { fontSize: 52, marginTop: spacing.lg },
  h1: { color: colors.text, fontSize: font.xxl, fontWeight: '900', marginTop: spacing.sm },
  month: { color: colors.textDim, fontSize: font.md, marginBottom: spacing.lg },
  hero: { width: '100%', alignItems: 'center', borderColor: colors.primaryDark, paddingVertical: spacing.xl },
  heroLabel: { color: colors.textDim, fontSize: font.xs, fontWeight: '800', letterSpacing: 1 },
  reward: { color: colors.primary, fontSize: font.huge, fontWeight: '900', marginTop: spacing.xs },
  heroSub: { color: colors.textDim, fontSize: font.sm, marginTop: 4 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rangeText: { color: colors.textFaint, fontSize: font.xs },
  grid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, width: '100%' },
  breakLabel: { color: colors.textDim, fontSize: font.xs, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakKey: { color: colors.textDim, fontSize: font.sm },
  breakVal: { color: colors.text, fontSize: font.sm, fontWeight: '700' },
  note: { color: colors.textFaint, fontSize: font.sm, textAlign: 'center', marginTop: spacing.lg, lineHeight: 20 },
  paidBadge: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: '#122019',
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 13,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  paidText: { color: colors.primary, fontSize: font.md, fontWeight: '800' },
  paidUndo: { color: colors.textDim, fontSize: font.xs, marginTop: 4, textDecorationLine: 'underline' },
});
