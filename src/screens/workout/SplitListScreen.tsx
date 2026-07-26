import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen, ScreenTitle } from '@/components/Screen';
import { Button, Card, IconButton, Pill, SectionHeader, Txt } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';
import { radius, spacing } from '@/theme';
import { WorkoutStackParamList } from '@/navigation/types';
import { useStore } from '@/store/useStore';
import { WEEKDAYS_SHORT } from '@/utils/date';
import { haptic } from '@/utils/feedback';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'SplitList'>;

export function SplitListScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const splits = useStore((s) => s.splits);
  const activeId = useStore((s) => s.settings.activeSplitId);
  const setActiveSplit = useStore((s) => s.setActiveSplit);
  const addSplit = useStore((s) => s.addSplit);
  const duplicateSplit = useStore((s) => s.duplicateSplit);
  const deleteSplit = useStore((s) => s.deleteSplit);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const create = () => {
    const s = addSplit(name || 'New Split');
    setName('');
    setAdding(false);
    nav.navigate('SplitEditor', { splitId: s.id });
  };

  const confirmDelete = (id: string, splitName: string) => {
    Alert.alert('Delete split?', `"${splitName}" will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSplit(id) },
    ]);
  };

  return (
    <Screen scroll>
      <ScreenTitle
        title="Splits"
        subtitle="Design your weekly plan"
        right={<IconButton name="add-circle" size={30} color={t.primary} onPress={() => setAdding((v) => !v)} />}
      />

      {adding && (
        <Card style={{ marginBottom: spacing.md }}>
          <Txt dim size={12} weight="700" style={{ marginBottom: 6 }}>
            NEW SPLIT NAME
          </Txt>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            placeholder="e.g. PPL 6-Day"
            placeholderTextColor={t.faint}
            style={{
              height: 48,
              backgroundColor: t.surfaceAlt,
              borderRadius: radius.md,
              color: t.text,
              paddingHorizontal: spacing.md,
              fontSize: 16,
              fontWeight: '600',
            }}
            returnKeyType="done"
            onSubmitEditing={create}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <Button title="Cancel" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setAdding(false)} />
            <Button title="Create" size="sm" style={{ flex: 1 }} onPress={create} />
          </View>
        </Card>
      )}

      {splits.map((split) => {
        const active = split.id === activeId;
        const trainingDays = split.days.filter((d) => !d.isRest).length;
        return (
          <Pressable
            key={split.id}
            onPress={() => nav.navigate('SplitEditor', { splitId: split.id })}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, marginBottom: spacing.md })}
          >
            <Card style={active ? { borderColor: t.primary, borderWidth: 1.5 } : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Txt size={19} weight="800">
                      {split.name}
                    </Txt>
                    {active && <Pill label="ACTIVE" active />}
                  </View>
                  <Txt dim size={13} style={{ marginTop: 2 }}>
                    {trainingDays} training day{trainingDays === 1 ? '' : 's'} / week
                  </Txt>
                </View>
                <IconButton name="chevron-forward" color={t.dim} onPress={() => nav.navigate('SplitEditor', { splitId: split.id })} />
              </View>

              {/* week strip */}
              <View style={{ flexDirection: 'row', gap: 4, marginTop: spacing.md }}>
                {split.days.map((d, i) => (
                  <View key={d.id} style={{ flex: 1, alignItems: 'center' }}>
                    <View
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: radius.sm,
                        backgroundColor: d.isRest ? t.surfaceAlt : t.primaryDark,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Txt size={11} weight="800" color={d.isRest ? t.faint : t.onPrimary}>
                        {d.isRest ? '—' : d.name.slice(0, 4)}
                      </Txt>
                    </View>
                    <Txt faint size={10} style={{ marginTop: 3 }}>
                      {WEEKDAYS_SHORT[i][0]}
                    </Txt>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                {!active && (
                  <Button
                    title="Set active"
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => {
                      haptic.success();
                      setActiveSplit(split.id);
                    }}
                  />
                )}
                <Button title="Duplicate" variant="secondary" size="sm" icon="copy-outline" style={{ flex: 1 }} onPress={() => duplicateSplit(split.id)} />
                <IconButton name="trash-outline" color={t.danger} bg={t.surfaceAlt} onPress={() => confirmDelete(split.id, split.name)} />
              </View>
            </Card>
          </Pressable>
        );
      })}

      {splits.length === 0 && !adding && (
        <Card>
          <Txt dim center>
            No splits yet. Tap + to build your first weekly plan.
          </Txt>
        </Card>
      )}
    </Screen>
  );
}
