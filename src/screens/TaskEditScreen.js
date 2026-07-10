import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, font, radius, categoryColors } from '../theme/theme';
import { CATEGORIES, IMPORTANCE_LEVELS, IMPORTANCE_POINTS } from '../constants';
import Button from '../components/Button';
import SegmentedPicker from '../components/SegmentedPicker';
import { useApp } from '../state/AppContext';
import { taskPoints } from '../logic/points';

// Add or edit a single task. Presented as a modal stack screen.
export default function TaskEditScreen({ navigation, route }) {
  const { tasks, priorityCategory, createTask, editTask } = useApp();
  const taskId = route.params?.taskId;
  const existing = taskId ? tasks.find((t) => t.id === taskId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || 'Health');
  const [importance, setImportance] = useState(existing?.importance || 'Medium');
  const [saving, setSaving] = useState(false);

  const previewTask = { category, importance };
  const previewPoints = taskPoints(previewTask, priorityCategory);
  const isPriority = priorityCategory && category === priorityCategory;

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = { title: title.trim(), category, importance };
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
          <SegmentedPicker
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            colorFor={(c) => categoryColors[c]}
          />

          <Text style={styles.label}>Importance</Text>
          <SegmentedPicker
            options={IMPORTANCE_LEVELS.map((l) => ({
              label: `${l} (${IMPORTANCE_POINTS[l]})`,
              value: l,
            }))}
            value={importance}
            onChange={setImportance}
          />

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
