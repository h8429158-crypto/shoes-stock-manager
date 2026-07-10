import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, font, radius, categoryColors } from '../theme/theme';
import {
  CATEGORIES,
  IMPORTANCE_LEVELS,
  IMPORTANCE_POINTS,
  WEEKDAY_LABELS,
  SCHEDULE_ALL,
  WEEKDAYS_ONLY,
} from '../constants';
import Button from '../components/Button';
import SegmentedPicker from '../components/SegmentedPicker';
import { useApp } from '../state/AppContext';
import { taskPoints } from '../logic/points';
import { parseDays, daysToString, SCHEDULE_PRESETS } from '../logic/schedule';

// Add or edit a single task. Presented as a modal stack screen.
export default function TaskEditScreen({ navigation, route }) {
  const { tasks, priorityCategory, createTask, editTask, lockedIds } = useApp();
  const taskId = route.params?.taskId;
  const existing = taskId ? tasks.find((t) => t.id === taskId) : null;
  const isEdit = !!existing;
  const locked = isEdit && lockedIds.has(taskId);

  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || 'Health');
  const [importance, setImportance] = useState(existing?.importance || 'Medium');
  const [days, setDays] = useState(existing?.days || SCHEDULE_ALL);
  const [saving, setSaving] = useState(false);

  const preset =
    days === SCHEDULE_ALL ? SCHEDULE_ALL : days === WEEKDAYS_ONLY ? WEEKDAYS_ONLY : 'custom';
  const selectedDays = parseDays(days);

  const setPreset = (value) => {
    if (value === 'custom') {
      // seed custom mode from current selection
      setDays(daysToString(selectedDays.length === 7 ? [1, 2, 3, 4, 5] : selectedDays));
    } else {
      setDays(value);
    }
  };

  const toggleDay = (idx) => {
    const set = new Set(selectedDays);
    if (set.has(idx)) set.delete(idx);
    else set.add(idx);
    if (set.size === 0) return; // never allow zero days
    setDays(daysToString([...set]));
  };

  const previewTask = { category, importance };
  const previewPoints = taskPoints(previewTask, priorityCategory);
  const isPriority = priorityCategory && category === priorityCategory;

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = { title: title.trim(), category, importance, days };
    if (isEdit) await editTask(taskId, data);
    else await createTask(data);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={styles.topBtn} />
          <Text style={styles.topTitle}>{isEdit ? 'Edit task' : 'New task'}</Text>
          <View style={styles.topBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {locked && (
            <View style={styles.lockBanner}>
              <Text style={styles.lockText}>
                🔒 Locked this month. You've already earned points from this task,
                so its points and schedule are frozen to keep your reward honest.
                You can still fix the name — everything unlocks on the 1st.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Task</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Read 20 pages"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoFocus={!isEdit}
          />

          <Text style={styles.label}>Category</Text>
          <View pointerEvents={locked ? 'none' : 'auto'} style={locked && styles.disabled}>
            <SegmentedPicker
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              colorFor={(c) => categoryColors[c]}
            />
          </View>

          <Text style={styles.label}>Importance</Text>
          <View pointerEvents={locked ? 'none' : 'auto'} style={locked && styles.disabled}>
            <SegmentedPicker
              options={IMPORTANCE_LEVELS.map((l) => ({
                label: `${l} (${IMPORTANCE_POINTS[l]})`,
                value: l,
              }))}
              value={importance}
              onChange={setImportance}
            />
          </View>

          <Text style={styles.label}>Repeat</Text>
          <View pointerEvents={locked ? 'none' : 'auto'} style={locked && styles.disabled}>
            <SegmentedPicker options={SCHEDULE_PRESETS} value={preset} onChange={setPreset} />
            {preset === 'custom' && (
              <View style={styles.dayRow}>
                {WEEKDAY_LABELS.map((label, idx) => {
                  const on = selectedDays.includes(idx);
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleDay(idx)}
                      style={[styles.dayPill, on && styles.dayPillOn]}
                    >
                      <Text style={[styles.dayText, on && styles.dayTextOn]}>{label[0]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Text style={styles.hint}>
              Days with no task become rest days — they never break your streak.
            </Text>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Worth per day</Text>
            <Text style={styles.previewPoints}>+{previewPoints} pts</Text>
            {isPriority ? (
              <Text style={styles.previewNote}>⭐ Doubled — matches this month's priority</Text>
            ) : (
              <Text style={styles.previewNote}>
                Base points. Match the monthly priority category for 2×.
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isEdit ? 'Save changes' : 'Add task'}
            onPress={save}
            disabled={!title.trim()}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBtn: { width: 90, minHeight: 40 },
  topTitle: { color: colors.text, fontSize: font.md, fontWeight: '800' },
  content: { padding: spacing.lg },
  disabled: { opacity: 0.45 },
  lockBanner: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  lockText: { color: colors.text, fontSize: font.xs, lineHeight: 18 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { color: colors.textDim, fontSize: font.sm, fontWeight: '700' },
  dayTextOn: { color: '#06210F', fontWeight: '800' },
  hint: { color: colors.textFaint, fontSize: font.xs, marginTop: spacing.sm },
  label: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: font.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  preview: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewLabel: { color: colors.textDim, fontSize: font.xs, fontWeight: '700', letterSpacing: 1 },
  previewPoints: { color: colors.accent, fontSize: font.xxl, fontWeight: '900', marginTop: 4 },
  previewNote: { color: colors.textFaint, fontSize: font.xs, marginTop: 6, textAlign: 'center' },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
