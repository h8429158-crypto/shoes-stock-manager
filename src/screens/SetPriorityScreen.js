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
import { CATEGORIES } from '../constants';
import Button from '../components/Button';
import SegmentedPicker from '../components/SegmentedPicker';
import { useApp } from '../state/AppContext';
import { formatMonthKey, currentMonthKey } from '../logic/dates';

export default function SetPriorityScreen({ navigation }) {
  const { priority, savePriority } = useApp();
  const [category, setCategory] = useState(priority?.category || 'Health');
  const [label, setLabel] = useState(priority?.label || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await savePriority(category, label.trim() || category);
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
          <Text style={styles.topTitle}>Monthly priority</Text>
          <View style={styles.topBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.month}>{formatMonthKey(currentMonthKey())}</Text>
          <Text style={styles.p}>
            Choose one focus for this month. Tasks tagged with the matching
            category earn double points.
          </Text>

          <Text style={styles.label}>Goal name</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Weight Loss, Learning, Business Growth"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <Text style={styles.label}>Category (for 2× matching)</Text>
          <SegmentedPicker
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            colorFor={(c) => categoryColors[c]}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save priority" onPress={save} loading={saving} />
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
  month: { color: colors.primary, fontSize: font.lg, fontWeight: '800' },
  p: { color: colors.textDim, fontSize: font.md, marginTop: spacing.sm, lineHeight: 22 },
  label: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
    marginTop: spacing.xl,
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
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
