import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { Screen, ScreenTitle } from '@/components/Screen';
import { Card, EmptyState, Pill, SectionHeader, StatTile, Txt } from '@/components/ui';
import { BarChart, LineChart } from '@/components/charts';
import { useTheme } from '@/theme/useTheme';
import { muscleColor } from '@/theme';
import { spacing } from '@/theme';
import {
  computePR,
  exerciseById,
  exerciseName,
  exercisesInHistory,
  useStore,
} from '@/store/useStore';
import { MUSCLE_GROUPS } from '@/types';
import { exerciseLog, exerciseSeries, weeklyMuscleVolume } from '@/utils/stats';
import { formatVolume, formatWeight, fromKg } from '@/utils/units';
import { formatDate } from '@/utils/date';

export function ProgressScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const chartW = width - spacing.lg * 2 - spacing.lg * 2; // inside a padded card

  const sessions = useStore((s) => s.sessions);
  const bodyweight = useStore((s) => s.bodyweight);
  const settings = useStore((s) => s.settings);
  const custom = useStore((s) => s.customExercises);
  const store = useStore();
  const exState = { customExercises: custom } as any;
  const unit = settings.unit;

  const exIds = useMemo(() => exercisesInHistory(sessions), [sessions]);
  const [selected, setSelected] = useState<string | null>(null);
  const activeEx = selected ?? exIds[0] ?? null;

  const series = useMemo(
    () => (activeEx ? exerciseSeries(sessions, activeEx) : []),
    [sessions, activeEx]
  );
  const pr = useMemo(
    () => (activeEx ? computePR(sessions, activeEx) : null),
    [sessions, activeEx]
  );
  const log = useMemo(
    () => (activeEx ? exerciseLog(sessions, activeEx) : []),
    [sessions, activeEx]
  );

  const muscleWeeks = useMemo(
    () =>
      weeklyMuscleVolume(sessions, (id) => exerciseById(store, id)?.muscle, 6),
    [sessions, store]
  );
  const currentWeek = muscleWeeks[muscleWeeks.length - 1];

  return (
    <Screen scroll>
      <ScreenTitle title="Progress" subtitle="Strength over time" />

      {/* Per-exercise strength */}
      <SectionHeader title="Exercise strength" />
      {exIds.length === 0 ? (
        <Card>
          <EmptyState icon="stats-chart-outline" title="No data yet" subtitle="Log workouts to chart your progress." />
        </Card>
      ) : (
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {exIds.map((id) => (
              <Pill key={id} label={exerciseName(exState, id)} active={id === activeEx} onPress={() => setSelected(id)} />
            ))}
          </ScrollView>

          <View style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm }}>
              <Legend color={t.primary} label="Est. 1RM" />
              <Legend color={t.series[1]} label="Top set" />
            </View>
            <LineChart
              width={chartW}
              height={200}
              yFormat={(n) => String(Math.round(fromKg(n, unit)))}
              series={[
                { color: t.primary, points: series.map((p) => ({ x: p.date, y: p.est1RM })) },
                { color: t.series[1], points: series.map((p) => ({ x: p.date, y: p.topSet })) },
              ]}
              xLabels={xLabelsFor(series.map((p) => p.date))}
            />
          </View>

          {pr && pr.bestEst1RMKg > 0 && (
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <StatTile label="Heaviest" value={formatWeight(pr.heaviestWeightKg, unit, false)} unit={unit} icon="barbell" />
              <StatTile label="Best set vol" value={formatVolume(pr.bestSetVolumeKg, unit).split(' ')[0]} unit={unit} icon="layers" />
              <StatTile label="Best 1RM" value={formatWeight(pr.bestEst1RMKg, unit, false)} unit={unit} icon="trophy" color={t.accent} />
            </View>
          )}
        </Card>
      )}

      {/* Per-exercise session log */}
      {activeEx && log.length > 0 && (
        <>
          <SectionHeader title={`${exerciseName(exState, activeEx)} log`} />
          <Card padded={false}>
            {log.map((entry, i) => (
              <View key={entry.sessionId}>
                {i > 0 && <View style={{ height: 1, backgroundColor: t.border }} />}
                <View style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Txt weight="800">{formatDate(entry.date)}</Txt>
                    <Txt dim size={12} weight="700">
                      {entry.dayName} · top {formatWeight(entry.topWeightKg, unit)}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
                    {entry.sets.map((st, j) => (
                      <View
                        key={j}
                        style={{
                          backgroundColor: t.surfaceAlt,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <Txt size={13} weight="700">
                          {formatWeight(st.weightKg, unit, false)}
                          <Txt dim size={12}> × {st.reps}</Txt>
                        </Txt>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Weekly muscle volume */}
      <SectionHeader title="Muscle volume" />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Txt dim size={12} weight="800">
            THIS WEEK BY MUSCLE
          </Txt>
          <Txt dim size={12} weight="700">
            total {formatVolume(currentWeek?.total ?? 0, unit)}
          </Txt>
        </View>
        <BarChart
          width={chartW}
          height={190}
          valueFormat={(n) => (fromKg(n, unit) >= 1000 ? `${Math.round(fromKg(n, unit) / 1000)}k` : String(Math.round(fromKg(n, unit))))}
          data={MUSCLE_GROUPS.map((m, i) => ({
            label: cap(m).slice(0, 4),
            value: currentWeek?.totals[m] ?? 0,
            color: muscleColor(t, i),
          }))}
        />
        <Txt faint size={11} center style={{ marginTop: spacing.sm }}>
          6-week trend: {muscleWeeks.map((w) => formatVolume(w.total, unit).split(' ')[0]).join(' → ')}
        </Txt>
      </Card>

      {/* Bodyweight */}
      <SectionHeader title="Body weight" />
      <Card>
        {bodyweight.length < 2 ? (
          <EmptyState icon="body-outline" title="Log your weight" subtitle="Add body-weight entries from Home." />
        ) : (
          <>
            <LineChart
              width={chartW}
              height={170}
              yFormat={(n) => String(Math.round(fromKg(n, unit)))}
              series={[
                {
                  color: t.series[2],
                  points: bodyweight.map((b) => ({ x: new Date(b.date).getTime(), y: b.weightKg })),
                },
              ]}
              xLabels={xLabelsFor(bodyweight.map((b) => new Date(b.date).getTime()))}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Txt dim size={13}>
                Start {formatWeight(bodyweight[0].weightKg, unit)}
              </Txt>
              <Txt weight="700">
                Now {formatWeight(bodyweight[bodyweight.length - 1].weightKg, unit)}
              </Txt>
            </View>
          </>
        )}
      </Card>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: color }} />
      <Txt dim size={12} weight="700">
        {label}
      </Txt>
    </View>
  );
}

function xLabelsFor(times: number[]): { x: number; label: string }[] {
  if (times.length === 0) return [];
  const min = Math.min(...times);
  const max = Math.max(...times);
  const fmt = (ms: number) => {
    const d = new Date(ms);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  if (min === max) return [{ x: min, label: fmt(min) }];
  return [
    { x: min, label: fmt(min) },
    { x: (min + max) / 2, label: fmt((min + max) / 2) },
    { x: max, label: fmt(max) },
  ];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
