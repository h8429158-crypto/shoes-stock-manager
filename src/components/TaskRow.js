import React, { useRef } from 'react';
import { Pressable, View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font, categoryColors } from '../theme/theme';

// A single checklist row with a satisfying tick animation + haptic feedback.
export default function TaskRow({ task, onToggle, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(task.done ? 1 : 0)).current;

  const animateTo = (done) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    Animated.spring(checkScale, {
      toValue: done ? 1 : 0,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    const willBeDone = !task.done;
    animateTo(willBeDone);
    Haptics.impactAsync(
      willBeDone ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
    onToggle(task);
  };

  const accent = categoryColors[task.category] || colors.textDim;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[styles.row, task.done && styles.rowDone, disabled && styles.rowDisabled]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.done, disabled }}
        accessibilityLabel={`${task.title}, worth ${task.points} points`}
      >
        <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
          <Animated.Text style={[styles.check, { transform: [{ scale: checkScale }] }]}>
            ✓
          </Animated.Text>
        </View>

        <View style={styles.middle}>
          <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={styles.meta}>
              {task.category} · {task.importance}
            </Text>
          </View>
        </View>

        <View style={styles.pointsWrap}>
          <Text style={[styles.points, task.done && styles.pointsDone]}>+{task.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowDone: { borderColor: colors.primaryDark, backgroundColor: '#122019' },
  rowDisabled: { opacity: 0.7 },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: '#06210F', fontSize: 20, fontWeight: '900' },
  middle: { flex: 1, paddingRight: spacing.sm },
  title: { color: colors.text, fontSize: font.md, fontWeight: '700' },
  titleDone: { color: colors.textDim, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  meta: { color: colors.textDim, fontSize: font.xs },
  pointsWrap: { alignItems: 'center', minWidth: 44 },
  points: { color: colors.accent, fontSize: font.lg, fontWeight: '800' },
  pointsDone: { color: colors.primary },
  pointsLabel: { color: colors.textFaint, fontSize: font.xs },
});
