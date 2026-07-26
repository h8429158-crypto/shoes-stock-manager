import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Button, Card, IconButton, Txt } from '@/components/ui';
import { Stepper } from '@/components/Stepper';
import { ExerciseGlyph } from '@/components/ExerciseGlyph';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { WorkoutStackParamList, RootStackParamList } from '@/navigation/types';
import { exerciseById, exerciseName, useStore } from '@/store/useStore';
import { SplitExercise } from '@/types';
import { fromKg, toKg, weightStep } from '@/utils/units';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'DayEditor'>;
type Rt = RouteProp<WorkoutStackParamList, 'DayEditor'>;

export function DayEditorScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { splitId, dayIndex } = useRoute<Rt>().params;

  const day = useStore((s) => s.splits.find((x) => x.id === splitId)?.days[dayIndex]);
  const unit = useStore((s) => s.settings.unit);
  const custom = useStore((s) => s.customExercises);
  const updateDayExercise = useStore((s) => s.updateDayExercise);
  const removeDayExercise = useStore((s) => s.removeDayExercise);
  const reorderDayExercises = useStore((s) => s.reorderDayExercises);
  const exState = { customExercises: custom } as any;

  if (!day) {
    return (
      <Screen>
        <Txt dim center style={{ marginTop: spacing.xxl }}>
          Day not found.
        </Txt>
      </Screen>
    );
  }

  const patch = (sxId: string, p: Partial<SplitExercise>) =>
    updateDayExercise(splitId, dayIndex, sxId, p);

  const confirmRemove = (sxId: string, name: string) =>
    Alert.alert('Remove exercise?', `Remove ${name} from this day?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeDayExercise(splitId, dayIndex, sxId) },
    ]);

  return (
    <Screen scroll>
      <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <Txt dim size={12} weight="700">
          EDITING
        </Txt>
        <Txt size={28} weight="900">
          {day.isRest ? 'Rest Day' : day.name}
        </Txt>
      </View>

      {day.exercises.map((se, i) => {
        const name = exerciseName(exState, se.exerciseId);
        return (
          <Swipeable
            key={se.id}
            renderRightActions={() => (
              <Pressable
                onPress={() => confirmRemove(se.id, name)}
                style={{
                  backgroundColor: t.danger,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 80,
                  borderRadius: radius.lg,
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="trash" size={22} color="#fff" />
              </Pressable>
            )}
          >
            <Card style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ gap: 2 }}>
                  <IconButton
                    name="chevron-up"
                    size={18}
                    color={i === 0 ? t.faint : t.dim}
                    disabled={i === 0}
                    onPress={() => reorderDayExercises(splitId, dayIndex, i, i - 1)}
                    style={{ width: 30, height: 26 }}
                  />
                  <IconButton
                    name="chevron-down"
                    size={18}
                    color={i === day.exercises.length - 1 ? t.faint : t.dim}
                    disabled={i === day.exercises.length - 1}
                    onPress={() => reorderDayExercises(splitId, dayIndex, i, i + 1)}
                    style={{ width: 30, height: 26 }}
                  />
                </View>
                <ExerciseGlyph muscle={exerciseById(exState, se.exerciseId)?.muscle ?? 'chest'} size={38} />
                <Txt size={16} weight="800" style={{ flex: 1 }} numberOfLines={2}>
                  {name}
                </Txt>
                <IconButton name="trash-outline" color={t.danger} onPress={() => confirmRemove(se.id, name)} />
              </View>

              {/* targets */}
              <View style={{ marginTop: spacing.md, gap: spacing.md }}>
                <Row label="Sets">
                  <Stepper value={se.targetSets} min={1} max={12} width={40} onChange={(v) => patch(se.id, { targetSets: v })} />
                </Row>
                <Row label="Reps">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Stepper value={se.repMin} min={1} max={se.repMax} width={34} onChange={(v) => patch(se.id, { repMin: v })} />
                    <Txt dim weight="800">
                      –
                    </Txt>
                    <Stepper value={se.repMax} min={se.repMin} max={50} width={34} onChange={(v) => patch(se.id, { repMax: v })} />
                  </View>
                </Row>
                <Row label={`Weight (${unit})`}>
                  {se.targetWeightKg == null ? (
                    <Button
                      title="Set target"
                      variant="secondary"
                      size="sm"
                      onPress={() => patch(se.id, { targetWeightKg: toKg(20, unit) })}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Stepper
                        value={Number(fromKg(se.targetWeightKg, unit).toFixed(1))}
                        min={0}
                        step={weightStep(unit)}
                        width={56}
                        onChange={(v) => patch(se.id, { targetWeightKg: toKg(v, unit) })}
                      />
                      <IconButton name="close-circle" color={t.faint} onPress={() => patch(se.id, { targetWeightKg: undefined })} />
                    </View>
                  )}
                </Row>
              </View>
            </Card>
          </Swipeable>
        );
      })}

      <Button
        title="Add exercise"
        icon="add"
        variant="secondary"
        onPress={() => {
          haptic.light();
          rootNav.navigate('ExercisePicker', { target: 'splitDay', splitId, dayIndex });
        }}
        style={{ marginTop: spacing.xs }}
      />
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt dim weight="700">
        {label}
      </Txt>
      {children}
    </View>
  );
}
