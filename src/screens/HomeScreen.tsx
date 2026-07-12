import React, { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen, ScreenTitle } from '@/components/Screen';
import { Button, Card, Divider, EmptyState, Pill, SectionHeader, StatTile, Txt } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import {
  allExercises,
  exerciseName,
  useStore,
} from '@/store/useStore';
import { computeStreak, recentPRs, weekStats } from '@/utils/stats';
import { formatVolume, formatWeight, fromKg, toKg } from '@/utils/units';
import { formatDate, mondayIndex, WEEKDAYS_LONG } from '@/utils/date';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const splits = useStore((s) => s.splits);
  const bodyweight = useStore((s) => s.bodyweight);
  const activeSession = useStore((s) => s.activeSession);
  const startSession = useStore((s) => s.startSession);
  const startEmptySession = useStore((s) => s.startEmptySession);
  const addBodyweight = useStore((s) => s.addBodyweight);
  const customExercises = useStore((s) => s.customExercises);

  const split = splits.find((s) => s.id === settings.activeSplitId) ?? splits[0];
  const todayIndex = mondayIndex(new Date());
  const today = split?.days[todayIndex];

  const streak = useMemo(() => computeStreak(sessions, split), [sessions, split]);
  const week = useMemo(() => weekStats(sessions, split), [sessions, split]);
  const prs = useMemo(() => recentPRs(sessions, 5), [sessions]);
  const exState = { customExercises } as any;

  const lastBw = bodyweight[bodyweight.length - 1];
  const [bwText, setBwText] = useState('');

  const start = () => {
    haptic.medium();
    if (activeSession) {
      nav.navigate('ActiveWorkout');
      return;
    }
    if (!split) {
      Alert.alert('No split', 'Create a split first in the Workout tab.');
      return;
    }
    if (today?.isRest || (today?.exercises.length ?? 0) === 0) {
      Alert.alert(
        today?.isRest ? 'Rest day' : 'Empty day',
        'Nothing is scheduled today. Start a freestyle workout instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Freestyle',
            onPress: () => {
              startEmptySession('Freestyle');
              nav.navigate('ActiveWorkout');
            },
          },
        ]
      );
      return;
    }
    startSession(split.id, todayIndex);
    nav.navigate('ActiveWorkout');
  };

  const submitBw = () => {
    const val = parseFloat(bwText.replace(',', '.'));
    if (!isFinite(val) || val <= 0) return;
    addBodyweight(toKg(val, settings.unit));
    setBwText('');
    haptic.success();
  };

  return (
    <Screen scroll>
      <ScreenTitle
        title={greeting()}
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      />

      {/* Today's session card */}
      <Card style={{ overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt dim size={12} weight="700">
              {WEEKDAYS_LONG[todayIndex].toUpperCase()} · {split?.name ?? 'No split'}
            </Txt>
            <Txt size={28} weight="900" style={{ marginTop: 2 }}>
              {activeSession
                ? activeSession.dayName
                : today
                ? today.isRest
                  ? 'Rest Day'
                  : today.name
                : 'No plan'}
            </Txt>
            <Txt dim style={{ marginTop: 2 }}>
              {activeSession
                ? 'Workout in progress'
                : today && !today.isRest
                ? `${today.exercises.length} exercise${today.exercises.length === 1 ? '' : 's'}`
                : 'Recovery & mobility'}
            </Txt>
          </View>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              backgroundColor: t.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={today?.isRest && !activeSession ? 'bed-outline' : 'barbell'}
              size={28}
              color={t.primary}
            />
          </View>
        </View>
        <Button
          title={activeSession ? 'Resume Workout' : today?.isRest ? 'Start Anyway' : 'Start Workout'}
          icon="play"
          size="lg"
          onPress={start}
          style={{ marginTop: spacing.lg }}
          fullWidth
        />
      </Card>

      {/* Weekly stats */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <StatTile label="Day streak" value={String(streak)} icon="flame" color={t.accent} />
        <StatTile
          label="This week"
          value={`${week.workouts}${week.target ? `/${week.target}` : ''}`}
          icon="checkmark-circle"
          color={t.success}
        />
        <StatTile
          label="Volume"
          value={formatVolume(week.volumeKg, settings.unit).split(' ')[0]}
          unit={settings.unit}
          icon="trending-up"
        />
      </View>

      {/* Recent PRs */}
      <SectionHeader title="Recent PRs" action={prs.length ? 'Progress' : undefined} onAction={() => nav.navigate('Main', { screen: 'Progress' } as any)} />
      {prs.length === 0 ? (
        <Card>
          <EmptyState icon="trophy-outline" title="No PRs yet" subtitle="Finish a workout to start setting records." />
        </Card>
      ) : (
        <Card padded={false}>
          {prs.map((pr, i) => (
            <View key={`${pr.exerciseId}-${pr.date}`}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.md,
                    backgroundColor: t.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="trophy" size={18} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="700" numberOfLines={1}>
                    {exerciseName(exState, pr.exerciseId)}
                  </Txt>
                  <Txt dim size={12}>
                    {formatWeight(pr.weightKg, settings.unit)} × {pr.reps} · {formatDate(pr.date)}
                  </Txt>
                </View>
                <Txt weight="800" color={t.accent}>
                  {formatWeight(pr.est1RMKg, settings.unit, false)}
                  <Txt dim size={11}> 1RM</Txt>
                </Txt>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Bodyweight quick entry */}
      <SectionHeader title="Body weight" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Txt dim size={12} weight="700">
              LATEST
            </Txt>
            <Txt size={24} weight="900">
              {lastBw ? formatWeight(lastBw.weightKg, settings.unit) : '—'}
            </Txt>
          </View>
          <TextInput
            value={bwText}
            onChangeText={setBwText}
            keyboardType="decimal-pad"
            placeholder={lastBw ? String(Math.round(fromKg(lastBw.weightKg, settings.unit))) : '0'}
            placeholderTextColor={t.faint}
            style={{
              width: 90,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: t.surfaceAlt,
              color: t.text,
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
              paddingHorizontal: spacing.sm,
            }}
            returnKeyType="done"
            onSubmitEditing={submitBw}
          />
          <Txt dim weight="700">
            {settings.unit}
          </Txt>
          <Pressable
            onPress={submitBw}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: t.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="add" size={26} color={t.onPrimary} />
          </Pressable>
        </View>
      </Card>

      <View style={{ height: spacing.lg }} />
      <Pill label="Plate calculator" onPress={() => nav.navigate('PlateCalculator')} />
    </Screen>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
