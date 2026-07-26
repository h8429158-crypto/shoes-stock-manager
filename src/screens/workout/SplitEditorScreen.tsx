import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Card, IconButton, Pill, Txt } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList, WorkoutStackParamList } from '@/navigation/types';
import { exerciseName, useStore } from '@/store/useStore';
import { WEEKDAYS_LONG } from '@/utils/date';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'SplitEditor'>;
type Rt = RouteProp<WorkoutStackParamList, 'SplitEditor'>;

export function SplitEditorScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { splitId } = useRoute<Rt>().params;

  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const split = useStore((s) => s.splits.find((x) => x.id === splitId));
  const renameSplit = useStore((s) => s.renameSplit);
  const setDayRest = useStore((s) => s.setDayRest);
  const setDayName = useStore((s) => s.setDayName);
  const startSession = useStore((s) => s.startSession);
  const custom = useStore((s) => s.customExercises);
  const exState = { customExercises: custom } as any;

  const startDay = (dayIndex: number) => {
    haptic.medium();
    startSession(splitId, dayIndex);
    rootNav.navigate('ActiveWorkout');
  };

  if (!split) {
    return (
      <Screen>
        <Txt dim center style={{ marginTop: spacing.xxl }}>
          Split not found.
        </Txt>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ paddingTop: spacing.sm }}>
        <Txt dim size={12} weight="700">
          SPLIT NAME
        </Txt>
        <TextInput
          value={split.name}
          onChangeText={(txt) => renameSplit(split.id, txt)}
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: t.text,
            paddingVertical: 4,
          }}
        />
      </View>

      {split.days.map((day, i) => (
        <Card key={day.id} style={{ marginTop: spacing.md }} padded={false}>
          <View style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Txt dim size={11} weight="700">
                  {WEEKDAYS_LONG[i].toUpperCase()}
                </Txt>
                {day.isRest ? (
                  <Txt size={18} weight="800" color={t.dim} style={{ marginTop: 2 }}>
                    Rest Day
                  </Txt>
                ) : (
                  <TextInput
                    value={day.name}
                    onChangeText={(txt) => setDayName(split.id, i, txt)}
                    placeholder="Day name"
                    placeholderTextColor={t.faint}
                    style={{ fontSize: 18, fontWeight: '800', color: t.text, marginTop: 2, paddingVertical: 2 }}
                  />
                )}
              </View>
              {!day.isRest && day.exercises.length > 0 && (
                <IconButton
                  name="play-circle"
                  size={26}
                  color={t.primary}
                  onPress={() => startDay(i)}
                />
              )}
              <Pill
                label={day.isRest ? 'Rest' : 'Training'}
                active={!day.isRest}
                onPress={() => {
                  haptic.light();
                  setDayRest(split.id, i, !day.isRest);
                }}
              />
            </View>

            {!day.isRest && (
              <>
                {day.exercises.length > 0 && (
                  <View style={{ marginTop: spacing.md, gap: 6 }}>
                    {day.exercises.map((se) => (
                      <View key={se.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Txt size={14} numberOfLines={1} style={{ flex: 1 }}>
                          {exerciseName(exState, se.exerciseId)}
                        </Txt>
                        <Txt dim size={13}>
                          {se.targetSets}×{se.repMin}–{se.repMax}
                        </Txt>
                      </View>
                    ))}
                  </View>
                )}
                <Pressable
                  onPress={() => nav.navigate('DayEditor', { splitId: split.id, dayIndex: i })}
                  style={({ pressed }) => ({
                    marginTop: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    height: 42,
                    borderRadius: radius.md,
                    backgroundColor: t.surfaceAlt,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name={day.exercises.length ? 'create-outline' : 'add'} size={18} color={t.primary} />
                  <Txt weight="700" color={t.primary}>
                    {day.exercises.length ? 'Edit exercises' : 'Add exercises'}
                  </Txt>
                </Pressable>
              </>
            )}
          </View>
        </Card>
      ))}
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}
