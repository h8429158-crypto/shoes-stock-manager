import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Button, Card, IconButton, Pill, Txt } from '@/components/ui';
import { CircularCountdown } from '@/components/CircularCountdown';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import {
  computePR,
  exerciseName,
  lastSessionForExercise,
  useStore,
} from '@/store/useStore';
import { LoggedSet, SessionExercise, SplitExercise } from '@/types';
import { epley1RM, overloadSuggestion, warmupSets } from '@/utils/calc';
import { formatDuration } from '@/utils/date';
import { formatWeight, fromKg, toKg, weightStep } from '@/utils/units';
import { haptic } from '@/utils/feedback';
import { useRestTimer } from '@/hooks/useRestTimer';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

export function ActiveWorkoutScreen() {
  useKeepAwake();
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { width } = useWindowDimensions();

  const session = useStore((s) => s.activeSession);
  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const splits = useStore((s) => s.splits);
  const custom = useStore((s) => s.customExercises);
  const toggleSetDone = useStore((s) => s.toggleSetDone);
  const finishSession = useStore((s) => s.finishSession);
  const discardSession = useStore((s) => s.discardSession);
  const setActiveNotes = useStore((s) => s.setActiveNotes);

  const exState = { customExercises: custom } as any;
  const rest = useRestTimer();
  const listRef = useRef<FlatList>(null);
  const [page, setPage] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [pr, setPr] = useState<{ text: string } | null>(null);

  // Live elapsed clock
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!session) return;
    const started = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.startedAt]);

  // Baseline all-time est-1RM per exercise, captured once for PR detection.
  const prBaseline = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!session) return;
    const map: Record<string, number> = {};
    for (const ex of session.exercises) {
      map[ex.exerciseId] = computePR(sessions, ex.exerciseId).bestEst1RMKg;
    }
    prBaseline.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // target lookup (rep range / weight) from the active split
  const targets = useMemo(() => {
    const map: Record<string, SplitExercise> = {};
    const split = splits.find((s) => s.id === settings.activeSplitId);
    split?.days.forEach((d) =>
      d.exercises.forEach((se) => {
        if (!map[se.exerciseId]) map[se.exerciseId] = se;
      })
    );
    return map;
  }, [splits, settings.activeSplitId]);

  if (!session) {
    // session was finished/discarded — pop back
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Txt dim center>
            No active workout.
          </Txt>
          <Button title="Back" variant="secondary" style={{ marginTop: spacing.lg }} onPress={() => nav.goBack()} />
        </View>
      </Screen>
    );
  }

  const doneCount = session.exercises.reduce(
    (n, ex) => n + (ex.sets.some((s) => s.done) ? 1 : 0),
    0
  );

  const onToggle = (exIndex: number, set: LoggedSet) => {
    const willBeDone = !set.done;
    toggleSetDone(exIndex, set.id);
    haptic.medium();
    if (!willBeDone) return;

    const ex = session.exercises[exIndex];
    // PR check
    const e1 = epley1RM(set.weightKg, set.reps);
    const baseline = prBaseline.current[ex.exerciseId] ?? 0;
    if (e1 > baseline + 1e-6 && set.weightKg > 0) {
      prBaseline.current[ex.exerciseId] = e1;
      haptic.celebrate();
      setPr({
        text: `New PR · ${exerciseName(exState, ex.exerciseId)} · ${formatWeight(e1, settings.unit, false)} ${settings.unit} 1RM`,
      });
      setTimeout(() => setPr(null), 2800);
    }
    // rest timer
    rest.start(settings.restDefaultSec);
  };

  const finish = () => {
    const anyDone = session.exercises.some((ex) => ex.sets.some((s) => s.done));
    Alert.alert(
      'Finish workout?',
      anyDone ? 'Your completed sets will be saved to history.' : 'No sets are checked off yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            rest.stop();
            const saved = finishSession();
            haptic.success();
            nav.goBack();
            if (saved && saved.exercises.length === 0) {
              // nothing saved (no done sets) — silent
            }
          },
        },
      ]
    );
  };

  const discard = () =>
    Alert.alert('Discard workout?', 'This session will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          rest.stop();
          discardSession();
          nav.goBack();
        },
      },
    ]);

  const goTo = (i: number) => {
    const idx = Math.max(0, Math.min(session.exercises.length - 1, i));
    listRef.current?.scrollToIndex({ index: idx, animated: true });
    setPage(idx);
  };

  return (
    <Screen edges={['top']} padded={false}>
      {/* Top bar */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconButton name="chevron-down" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Txt size={19} weight="900" numberOfLines={1}>
              {session.dayName}
            </Txt>
            <Txt dim size={12} weight="700">
              {formatDuration(elapsed)} · {doneCount}/{session.exercises.length} done
            </Txt>
          </View>
          <IconButton name={showNotes ? 'document-text' : 'document-text-outline'} color={showNotes ? t.primary : t.dim} onPress={() => setShowNotes((v) => !v)} />
          <Button title="Finish" size="sm" icon="checkmark" onPress={finish} />
        </View>

        {showNotes && (
          <Card style={{ marginTop: spacing.sm }}>
            <TextInput
              value={session.notes}
              onChangeText={setActiveNotes}
              placeholder="Session notes (how did it feel?)"
              placeholderTextColor={t.faint}
              multiline
              style={{ color: t.text, fontSize: 15, minHeight: 44 }}
            />
          </Card>
        )}

        {/* exercise pager tabs */}
        {session.exercises.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}>
            {session.exercises.map((ex, i) => (
              <Pressable
                key={`${ex.exerciseId}-${i}`}
                onPress={() => goTo(i)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: i === page ? t.primary : t.surface,
                  borderWidth: 1,
                  borderColor: i === page ? t.primary : t.border,
                }}
              >
                <Txt size={12} weight="800" color={i === page ? t.onPrimary : t.dim}>
                  {i + 1}. {exerciseName(exState, ex.exerciseId).split(' ').slice(0, 2).join(' ')}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Pager */}
      {session.exercises.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
          <Txt dim center>
            No exercises yet.
          </Txt>
          <Button
            title="Add exercise"
            icon="add"
            style={{ marginTop: spacing.lg }}
            onPress={() => nav.navigate('ExercisePicker', { target: 'session' })}
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={session.exercises}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.exerciseId}-${i}`}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index }) => (
            <View style={{ width }}>
              <ExercisePage
                exIndex={index}
                exercise={item}
                target={targets[item.exerciseId]}
                unit={settings.unit}
                barKg={settings.barWeightKg}
                lastSession={lastSessionForExercise(sessions, item.exerciseId)}
                nameOf={(id) => exerciseName(exState, id)}
                onToggle={onToggle}
              />
            </View>
          )}
        />
      )}

      {/* Rest timer overlay */}
      {rest.running && (
        <View style={{ position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <CircularCountdown remaining={rest.remaining} total={rest.total} size={72} stroke={7} />
            <View style={{ flex: 1 }}>
              <Txt dim size={12} weight="800">
                REST
              </Txt>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                <Pill label="-15s" onPress={() => rest.addTime(-15)} />
                <Pill label="+15s" onPress={() => rest.addTime(15)} />
              </View>
            </View>
            <IconButton name="close-circle" size={28} color={t.dim} onPress={rest.stop} />
          </Card>
        </View>
      )}

      {/* PR banner */}
      {pr && (
        <View style={{ position: 'absolute', top: spacing.xxl * 2, left: spacing.lg, right: spacing.lg }}>
          <View
            style={{
              backgroundColor: t.accent,
              borderRadius: radius.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Ionicons name="trophy" size={22} color="#1a1200" />
            <Txt weight="900" color="#1a1200" style={{ flex: 1 }}>
              {pr.text}
            </Txt>
          </View>
        </View>
      )}

      {/* footer actions */}
      <View style={{ position: 'absolute', top: spacing.xs, right: 0 }} />
      <Pressable onPress={discard} style={{ position: 'absolute', bottom: 2, alignSelf: 'center' }}>
        <Txt faint size={12} weight="700">
          Discard workout
        </Txt>
      </Pressable>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// One exercise page: sets, last-session hint, warm-up, overload nudge.
// ---------------------------------------------------------------------------

function ExercisePage({
  exIndex,
  exercise,
  target,
  unit,
  barKg,
  lastSession,
  nameOf,
  onToggle,
}: {
  exIndex: number;
  exercise: SessionExercise;
  target?: SplitExercise;
  unit: 'kg' | 'lb';
  barKg: number;
  lastSession?: SessionExercise;
  nameOf: (id: string) => string;
  onToggle: (exIndex: number, set: LoggedSet) => void;
}) {
  const t = useTheme();
  const updateActiveSet = useStore((s) => s.updateActiveSet);
  const addSet = useStore((s) => s.addSet);
  const removeSet = useStore((s) => s.removeSet);
  const [showWarmup, setShowWarmup] = useState(false);

  const repRange = target ? `${target.repMin}–${target.repMax}` : null;
  const workingKg = exercise.sets[0]?.weightKg || target?.targetWeightKg || 0;

  const nudge =
    target && lastSession ? overloadSuggestion(lastSession, target.repMax) : null;
  const warmups = workingKg > 0 ? warmupSets(workingKg, barKg) : [];

  const copyDown = (set: LoggedSet) => {
    haptic.medium();
    addSet(exIndex);
    // the new set copies the last set already; but ensure it matches this one
    // by patching after add on next tick via store snapshot
    const cur = useStore.getState().activeSession;
    const ex = cur?.exercises[exIndex];
    const created = ex?.sets[ex.sets.length - 1];
    if (created) {
      updateActiveSet(exIndex, created.id, { weightKg: set.weightKg, reps: set.reps, done: false });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Txt size={24} weight="900">
        {nameOf(exercise.exerciseId)}
      </Txt>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 6, flexWrap: 'wrap' }}>
        {target && <Pill label={`Target ${target.targetSets}×${repRange}`} />}
        {target?.targetWeightKg != null && <Pill label={formatWeight(target.targetWeightKg, unit)} />}
        {lastSession && (
          <Pill
            label={`Last: ${formatWeight(lastSession.sets[0]?.weightKg ?? 0, unit, false)}×${lastSession.sets[0]?.reps ?? 0}`}
            bg={t.surfaceAlt}
          />
        )}
      </View>

      {nudge != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }}>
          <Ionicons name="trending-up" size={18} color={t.success} />
          <Txt size={13} weight="700" style={{ flex: 1 }}>
            You maxed the rep range last time — try {formatWeight(nudge, unit)} today.
          </Txt>
        </View>
      )}

      {/* header row */}
      <View style={{ flexDirection: 'row', marginTop: spacing.lg, paddingHorizontal: 4 }}>
        <Txt dim size={12} weight="800" style={{ width: 34 }}>
          SET
        </Txt>
        <Txt dim size={12} weight="800" style={{ flex: 1, textAlign: 'center' }}>
          WEIGHT ({unit})
        </Txt>
        <Txt dim size={12} weight="800" style={{ flex: 1, textAlign: 'center' }}>
          REPS
        </Txt>
        <View style={{ width: 46 }} />
      </View>

      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          index={i}
          set={set}
          unit={unit}
          lastSet={lastSession?.sets[i]}
          onChangeWeight={(kg) => updateActiveSet(exIndex, set.id, { weightKg: kg })}
          onChangeReps={(r) => updateActiveSet(exIndex, set.id, { reps: r })}
          onToggle={() => onToggle(exIndex, set)}
          onRemove={() => removeSet(exIndex, set.id)}
          onCopyDown={() => copyDown(set)}
        />
      ))}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Button title="Add set" icon="add" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => addSet(exIndex)} />
        {warmups.length > 0 && (
          <Button
            title="Warm-up"
            icon="flame-outline"
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => setShowWarmup((v) => !v)}
          />
        )}
      </View>

      {showWarmup && warmups.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <Txt dim size={12} weight="800" style={{ marginBottom: spacing.sm }}>
            WARM-UP RAMP → {formatWeight(workingKg, unit)}
          </Txt>
          {warmups.map((w, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Txt dim>{w.percent === 0 ? 'Empty bar' : `${Math.round(w.percent * 100)}%`}</Txt>
              <Txt weight="700">
                {formatWeight(w.weightKg, unit)} × {w.reps}
              </Txt>
            </View>
          ))}
        </Card>
      )}

      <Txt faint size={12} center style={{ marginTop: spacing.lg }}>
        Long-press a set to copy it down · swipe between exercises
      </Txt>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function SetRow({
  index,
  set,
  unit,
  lastSet,
  onChangeWeight,
  onChangeReps,
  onToggle,
  onRemove,
  onCopyDown,
}: {
  index: number;
  set: LoggedSet;
  unit: 'kg' | 'lb';
  lastSet?: LoggedSet;
  onChangeWeight: (kg: number) => void;
  onChangeReps: (reps: number) => void;
  onToggle: () => void;
  onRemove: () => void;
  onCopyDown: () => void;
}) {
  const t = useTheme();
  const step = weightStep(unit);
  const wDisplay = set.weightKg ? String(Number(fromKg(set.weightKg, unit).toFixed(1))) : '';
  const lastHint = lastSet
    ? `${Number(fromKg(lastSet.weightKg, unit).toFixed(1))}`
    : undefined;

  const bumpWeight = (dir: number) => {
    const cur = Number(fromKg(set.weightKg, unit).toFixed(2));
    const next = Math.max(0, cur + dir * step);
    haptic.light();
    onChangeWeight(toKg(next, unit));
  };
  const bumpReps = (dir: number) => {
    haptic.light();
    onChangeReps(Math.max(0, set.reps + dir));
  };

  return (
    <Pressable
      onLongPress={onCopyDown}
      delayLongPress={350}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: set.done ? t.surfaceAlt : 'transparent',
        borderRadius: radius.md,
        paddingVertical: 6,
        marginTop: 6,
      }}
    >
      <View style={{ width: 34, alignItems: 'center' }}>
        <Txt size={17} weight="900" color={set.done ? t.primary : t.dim}>
          {index + 1}
        </Txt>
      </View>

      {/* weight cell */}
      <NumberCell
        value={wDisplay}
        placeholder={lastSet ? lastHint : '0'}
        onDec={() => bumpWeight(-1)}
        onInc={() => bumpWeight(1)}
        onChangeText={(txt) => {
          const v = parseFloat(txt.replace(',', '.'));
          onChangeWeight(isFinite(v) ? toKg(v, unit) : 0);
        }}
      />

      {/* reps cell */}
      <NumberCell
        value={set.reps ? String(set.reps) : ''}
        placeholder={lastSet ? String(lastSet.reps) : '0'}
        onDec={() => bumpReps(-1)}
        onInc={() => bumpReps(1)}
        onChangeText={(txt) => {
          const v = parseInt(txt.replace(/[^0-9]/g, ''), 10);
          onChangeReps(isFinite(v) ? v : 0);
        }}
        integer
      />

      {/* done + remove */}
      <View style={{ width: 46, alignItems: 'center' }}>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.md,
            backgroundColor: set.done ? t.success : t.surface,
            borderWidth: set.done ? 0 : 1.5,
            borderColor: t.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={22} color={set.done ? '#fff' : t.faint} />
        </Pressable>
      </View>
      <Pressable onPress={onRemove} hitSlop={6} style={{ paddingLeft: 2 }}>
        <Ionicons name="remove-circle-outline" size={18} color={t.faint} />
      </Pressable>
    </Pressable>
  );
}

function NumberCell({
  value,
  placeholder,
  onChangeText,
  onInc,
  onDec,
  integer,
}: {
  value: string;
  placeholder?: string;
  onChangeText: (t: string) => void;
  onInc: () => void;
  onDec: () => void;
  integer?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Pressable onPress={onDec} hitSlop={6} style={{ width: 30, height: 40, borderRadius: 8, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="remove" size={18} color={t.dim} />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faint}
        keyboardType={integer ? 'number-pad' : 'decimal-pad'}
        selectTextOnFocus
        style={{
          minWidth: 46,
          textAlign: 'center',
          color: t.text,
          fontSize: 22,
          fontWeight: '900',
          paddingVertical: 2,
        }}
      />
      <Pressable onPress={onInc} hitSlop={6} style={{ width: 30, height: 40, borderRadius: 8, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="add" size={18} color={t.dim} />
      </Pressable>
    </View>
  );
}
