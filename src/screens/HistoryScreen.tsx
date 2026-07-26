import React, { useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { Screen, ScreenTitle } from '@/components/Screen';
import { Card, Divider, EmptyState, Txt } from '@/components/ui';
import { CalendarHeatmap } from '@/components/charts';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { exerciseName, useStore } from '@/store/useStore';
import { Session } from '@/types';
import { volumeByDay } from '@/utils/stats';
import { formatDate, formatDuration, formatTime } from '@/utils/date';
import { formatVolume, formatWeight } from '@/utils/units';
import { haptic } from '@/utils/feedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function HistoryScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const custom = useStore((s) => s.customExercises);
  const deleteSession = useStore((s) => s.deleteSession);
  const exState = { customExercises: custom } as any;

  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)
      ),
    [sessions]
  );

  const volMap = useMemo(() => volumeByDay(sessions), [sessions]);
  const maxVol = Math.max(1, ...Object.values(volMap));

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((cur) => (cur === id ? null : id));
  };

  const confirmDelete = (s: Session) =>
    Alert.alert('Delete workout?', `${s.dayName} · ${formatDate(s.finishedAt ?? s.startedAt)} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession(s.id) },
    ]);

  return (
    <Screen scroll>
      <ScreenTitle title="History" subtitle={`${sessions.length} workouts logged`} />

      <Card style={{ marginBottom: spacing.lg }}>
        <Txt dim size={12} weight="800" style={{ marginBottom: spacing.sm }}>
          TRAINING DAYS
        </Txt>
        <CalendarHeatmap width={width - spacing.lg * 4} intensity={(k) => (volMap[k] ? Math.min(1, volMap[k] / maxVol) : 0)} />
      </Card>

      {sorted.length === 0 && (
        <Card>
          <EmptyState icon="calendar-outline" title="No workouts yet" subtitle="Finished sessions will appear here." />
        </Card>
      )}

      {sorted.map((s) => {
        const isOpen = expanded === s.id;
        return (
          <Swipeable
            key={s.id}
            renderRightActions={() => (
              <Pressable
                onPress={() => confirmDelete(s)}
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
            <Card style={{ marginBottom: spacing.md }} padded={false}>
              <Pressable
                onPress={() => {
                  haptic.light();
                  toggle(s.id);
                }}
                style={{ padding: spacing.lg }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Txt size={17} weight="800">
                      {s.dayName}
                    </Txt>
                    <Txt dim size={13} style={{ marginTop: 2 }}>
                      {formatDate(s.finishedAt ?? s.startedAt)} · {formatTime(s.startedAt)}
                    </Txt>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={t.dim} />
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
                  <Meta icon="barbell-outline" text={`${s.exercises.length} ex`} />
                  <Meta icon="layers-outline" text={`${s.exercises.reduce((n, e) => n + e.sets.length, 0)} sets`} />
                  <Meta icon="trending-up-outline" text={formatVolume(s.totalVolumeKg, settings.unit)} />
                  <Meta icon="time-outline" text={formatDuration(s.durationSec)} />
                </View>
              </Pressable>

              {isOpen && (
                <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
                  <Divider />
                  {s.exercises.map((ex, i) => (
                    <View key={i} style={{ marginTop: spacing.md }}>
                      <Txt weight="800">{exerciseName(exState, ex.exerciseId)}</Txt>
                      <View style={{ marginTop: 4, gap: 2 }}>
                        {ex.sets.map((st, j) => (
                          <View key={st.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Txt dim size={13}>
                              Set {j + 1}
                            </Txt>
                            <Txt size={14} weight="600">
                              {formatWeight(st.weightKg, settings.unit)} × {st.reps}
                            </Txt>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                  {s.notes ? (
                    <Txt dim size={13} style={{ marginTop: spacing.md, fontStyle: 'italic' }}>
                      "{s.notes}"
                    </Txt>
                  ) : null}
                </View>
              )}
            </Card>
          </Swipeable>
        );
      })}
    </Screen>
  );
}

function Meta({ icon, text }: { icon: any; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={14} color={t.dim} />
      <Txt dim size={13} weight="600">
        {text}
      </Txt>
    </View>
  );
}
