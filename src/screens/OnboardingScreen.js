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
import { StatusBar } from 'expo-status-bar';

import { colors, spacing, font, radius } from '../theme/theme';
import { CATEGORIES, IMPORTANCE_LEVELS } from '../constants';
import { categoryColors } from '../theme/theme';
import Button from '../components/Button';
import SegmentedPicker from '../components/SegmentedPicker';
import { useApp } from '../state/AppContext';

const emptyTask = () => ({ title: '', category: 'Health', importance: 'Medium' });

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [priorityCategory, setPriorityCategory] = useState('Health');
  const [priorityLabel, setPriorityLabel] = useState('');
  const [tasks, setTasks] = useState([emptyTask(), emptyTask(), emptyTask()]);

  const setTaskField = (i, field, value) => {
    setTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && !!priorityCategory) ||
    step === 2;

  const finish = async () => {
    setSaving(true);
    const firstTasks = tasks.filter((t) => t.title.trim().length > 0);
    await completeOnboarding({
      name: name.trim(),
      priorityCategory,
      priorityLabel: priorityLabel.trim() || priorityCategory,
      firstTasks,
    });
    // Provider flips onboarded -> navigator swaps to the main app automatically.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          {step === 0 && (
            <View>
              <Text style={styles.emoji}>👋</Text>
              <Text style={styles.h1}>Welcome</Text>
              <Text style={styles.p}>
                Build daily habits, earn points, and pay yourself a real reward
                every month — from ₹10,000 up to ₹20,000.
              </Text>
              <Text style={styles.label}>What should we call you?</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                autoFocus
                returnKeyType="next"
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={styles.h1}>This month's priority</Text>
              <Text style={styles.p}>
                Pick one focus for the month. Tasks in this category earn double
                points, so you stay pulled toward what matters most.
              </Text>
              <Text style={styles.label}>Name your goal</Text>
              <TextInput
                value={priorityLabel}
                onChangeText={setPriorityLabel}
                placeholder="e.g. Weight Loss, Business Growth"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
              />
              <Text style={styles.label}>Category (for 2× matching)</Text>
              <SegmentedPicker
                options={CATEGORIES}
                value={priorityCategory}
                onChange={setPriorityCategory}
                colorFor={(c) => categoryColors[c]}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.h1}>Your first tasks</Text>
              <Text style={styles.p}>
                Add up to three daily tasks to start. You can change these anytime.
              </Text>
              {tasks.map((t, i) => (
                <View key={i} style={styles.taskCard}>
                  <TextInput
                    value={t.title}
                    onChangeText={(v) => setTaskField(i, 'title', v)}
                    placeholder={`Task ${i + 1} (e.g. Workout 30 min)`}
                    placeholderTextColor={colors.textFaint}
                    style={styles.input}
                  />
                  <Text style={styles.miniLabel}>Category</Text>
                  <SegmentedPicker
                    options={CATEGORIES}
                    value={t.category}
                    onChange={(v) => setTaskField(i, 'category', v)}
                    colorFor={(c) => categoryColors[c]}
                  />
                  <Text style={styles.miniLabel}>Importance</Text>
                  <SegmentedPicker
                    options={IMPORTANCE_LEVELS}
                    value={t.importance}
                    onChange={(v) => setTaskField(i, 'importance', v)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <Button
              title="Back"
              variant="ghost"
              onPress={() => setStep((s) => s - 1)}
              style={styles.footerBtn}
            />
          )}
          {step < 2 ? (
            <Button
              title="Continue"
              onPress={() => setStep((s) => s + 1)}
              disabled={!canNext}
              style={styles.footerBtnGrow}
            />
          ) : (
            <Button
              title="Start earning"
              onPress={finish}
              loading={saving}
              style={styles.footerBtnGrow}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.md },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  emoji: { fontSize: 44, marginTop: spacing.lg },
  h1: { color: colors.text, fontSize: font.xxl, fontWeight: '800', marginTop: spacing.sm },
  p: { color: colors.textDim, fontSize: font.md, marginTop: spacing.sm, lineHeight: 22 },
  label: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  miniLabel: {
    color: colors.textDim,
    fontSize: font.xs,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
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
  taskCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  footerBtn: { paddingHorizontal: spacing.lg },
  footerBtnGrow: { flex: 1 },
});
