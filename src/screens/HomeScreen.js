import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import Screen, { SectionTitle } from '../components/Screen';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import TaskRow from '../components/TaskRow';
import Button from '../components/Button';
import { colors, spacing, font, radius, categoryColors } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatRupees, formatPercent } from '../logic/rewards';
import { formatLongDate, isLastDayOfMonth } from '../logic/dates';

export default function HomeScreen({ navigation }) {
  const { summary, priority, settings, toggleTask } = useApp();
  const today = useMemo(() => formatLongDate(new Date()), []);
  const lastDay = isLastDayOfMonth();

  const pending = summary.todayCount - summary.todayDone;
  const greeting = settings.name ? `Hi ${settings.name}` : 'Today';

  return (
    <Screen title={greeting} subtitle={today}>
      <StatusBar style="light" />

      {/* Live reward hero */}
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>CURRENT REWARD</Text>
        <Text style={styles.reward}>{formatRupees(summary.reward)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>
            ₹{summary.perDay.toFixed(2)}/day
          </Text>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroMeta}>
            {formatPercent(summary.consistency)} of tasks done
          </Text>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroMeta}>{summary.totalPoints} pts</Text>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar ratio={summary.progress} color={colors.primary} height={14} />
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>{formatRupees(summary.rewardMin)}</Text>
            <Text style={styles.rangeText}>{formatRupees(summary.rewardMax)}</Text>
          </View>
        </View>
        {summary.projectedReward > summary.reward && (
          <View style={styles.forecast}>
            <Text style={styles.forecastText}>
              🎯 Finish every day this month → on pace for{' '}
              <Text style={styles.forecastAmount}>{formatRupees(summary.projectedReward)}</Text>
            </Text>
          </View>
        )}
      </Card>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Text style={styles.miniValue}>
            {summary.todayEarned}
            <Text style={styles.miniValueDim}>/{summary.todayPossible}</Text>
          </Text>
          <Text style={styles.miniLabel}>Today's points</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={[styles.miniValue, { color: colors.accent }]}>
            🔥 {summary.currentStreak}
          </Text>
          <Text style={styles.miniLabel}>Day streak</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniValue}>{summary.bestStreak}</Text>
          <Text style={styles.miniLabel}>Best streak</Text>
        </View>
      </View>

      {/* Monthly priority banner */}
      {priority ? (
        <Pressable onPress={() => navigation.navigate('SetPriority')}>
          <View style={[styles.priorityBanner, { borderColor: categoryColors[priority.category] }]}>
            <Text style={styles.priorityLabel}>THIS MONTH'S PRIORITY</Text>
            <Text style={styles.priorityValue}>
              {priority.label || priority.category}
            </Text>
            <Text style={styles.prioritySub}>
              {priority.category} tasks earn 2× points · tap to change
            </Text>
          </View>
        </Pressable>
      ) : (
        <Card style={styles.priorityMissing}>
          <Text style={styles.priorityMissingText}>
            Set this month's priority to start earning double points.
          </Text>
          <Button
            title="Set priority"
            onPress={() => navigation.navigate('SetPriority')}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {/* Month complete on the last day */}
      {lastDay && (
        <Button
          title="🏁 View month summary"
          variant="secondary"
          onPress={() => navigation.navigate('MonthComplete')}
          style={{ marginTop: spacing.md }}
        />
      )}

      {/* Today's checklist */}
      <View style={styles.checklistHeader}>
        <SectionTitle style={{ marginBottom: 0 }}>Today's tasks</SectionTitle>
        <Text style={styles.pendingText}>
          {pending > 0 ? `${pending} pending` : 'All done 🎉'}
        </Text>
      </View>

      {summary.todaysTasks.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No tasks yet. Add your daily habits to start earning.
          </Text>
          <Button
            title="Add a task"
            onPress={() => navigation.navigate('TaskEdit', {})}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        summary.todaysTasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={toggleTask} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: font.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reward: {
    color: colors.primary,
    fontSize: font.huge,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  heroMeta: { color: colors.textDim, fontSize: font.sm },
  heroDot: { color: colors.textFaint, marginHorizontal: spacing.sm },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rangeText: { color: colors.textFaint, fontSize: font.xs },
  forecast: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  forecastText: { color: colors.textDim, fontSize: font.sm, textAlign: 'center' },
  forecastAmount: { color: colors.accent, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  miniValue: { color: colors.text, fontSize: font.lg, fontWeight: '800' },
  miniValueDim: { color: colors.textFaint, fontSize: font.md, fontWeight: '700' },
  miniLabel: { color: colors.textDim, fontSize: font.xs, marginTop: 2 },
  priorityBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  priorityLabel: { color: colors.textDim, fontSize: font.xs, fontWeight: '800', letterSpacing: 1 },
  priorityValue: { color: colors.text, fontSize: font.lg, fontWeight: '800', marginTop: 2 },
  prioritySub: { color: colors.textFaint, fontSize: font.xs, marginTop: 4 },
  priorityMissing: { marginTop: spacing.md },
  priorityMissingText: { color: colors.text, fontSize: font.md, lineHeight: 22 },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  pendingText: { color: colors.textDim, fontSize: font.sm, fontWeight: '600' },
  emptyText: { color: colors.textDim, fontSize: font.md, lineHeight: 22 },
});
