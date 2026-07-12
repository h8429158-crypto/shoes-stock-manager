import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Button, IconButton, Pill, Txt } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { allExercises, useStore } from '@/store/useStore';
import { Exercise, MUSCLE_GROUPS, MuscleGroup } from '@/types';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExercisePicker'>;
type Rt = RouteProp<RootStackParamList, 'ExercisePicker'>;

export function ExercisePickerScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const params = useRoute<Rt>().params;

  const store = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | null>(null);
  const [creatingMuscle, setCreatingMuscle] = useState<MuscleGroup>('chest');
  const [showCreate, setShowCreate] = useState(false);

  const library = allExercises(store);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = MUSCLE_GROUPS.filter((m) => !filter || m === filter).map((m) => ({
      title: m,
      data: library.filter(
        (e) => e.muscle === m && (!q || e.name.toLowerCase().includes(q))
      ),
    }));
    return groups.filter((g) => g.data.length > 0);
  }, [library, query, filter]);

  const pick = (ex: Exercise) => {
    haptic.medium();
    if (params.target === 'session') {
      store.addExerciseToSession(ex.id);
    } else {
      store.addDayExercise(params.splitId, params.dayIndex, ex.id);
    }
    nav.goBack();
  };

  const createCustom = () => {
    const name = query.trim();
    if (!name) return;
    const ex = store.addCustomExercise(name, creatingMuscle);
    pick(ex);
  };

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, gap: spacing.sm }}>
        <IconButton name="close" onPress={() => nav.goBack()} />
        <Txt size={20} weight="900" style={{ flex: 1 }}>
          Add Exercise
        </Txt>
      </View>

      {/* search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          marginTop: spacing.sm,
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        <Ionicons name="search" size={18} color={t.dim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={t.faint}
          autoCorrect={false}
          style={{ flex: 1, height: 48, color: t.text, fontSize: 16, marginLeft: spacing.sm }}
        />
        {query.length > 0 && <IconButton name="close-circle" size={18} color={t.faint} onPress={() => setQuery('')} />}
      </View>

      {/* muscle filter chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
        <Pill label="All" active={filter === null} onPress={() => setFilter(null)} />
        {MUSCLE_GROUPS.map((m) => (
          <Pill key={m} label={cap(m)} active={filter === m} onPress={() => setFilter(filter === m ? null : m)} />
        ))}
      </View>

      <SectionList
        style={{ marginTop: spacing.md }}
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        renderSectionHeader={({ section }) => (
          <Txt dim size={12} weight="800" style={{ marginTop: spacing.md, marginBottom: 6 }}>
            {cap(section.title as string).toUpperCase()}
          </Txt>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => pick(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              paddingHorizontal: spacing.md,
              backgroundColor: pressed ? t.surfaceAlt : t.surface,
              borderRadius: radius.md,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: t.border,
            })}
          >
            <View style={{ flex: 1 }}>
              <Txt weight="700">{item.name}</Txt>
              {item.custom && (
                <Txt faint size={11} weight="700">
                  CUSTOM
                </Txt>
              )}
            </View>
            <Ionicons name="add-circle" size={26} color={t.primary} />
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ marginTop: spacing.lg }}>
            {query.trim().length > 0 && !showCreate && (
              <Button title={`Create "${query.trim()}"`} icon="add" variant="secondary" onPress={() => setShowCreate(true)} />
            )}
            {showCreate && (
              <View style={{ backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: t.border }}>
                <Txt weight="800">New exercise</Txt>
                <Txt dim size={13} style={{ marginTop: 2 }}>
                  "{query.trim() || 'Name in search box'}"
                </Txt>
                <Txt dim size={12} weight="700" style={{ marginTop: spacing.md, marginBottom: 6 }}>
                  MUSCLE GROUP
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {MUSCLE_GROUPS.map((m) => (
                    <Pill key={m} label={cap(m)} active={creatingMuscle === m} onPress={() => setCreatingMuscle(m)} />
                  ))}
                </View>
                <Button title="Create & add" onPress={createCustom} style={{ marginTop: spacing.md }} disabled={!query.trim()} />
              </View>
            )}
          </View>
        }
      />
    </Screen>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
