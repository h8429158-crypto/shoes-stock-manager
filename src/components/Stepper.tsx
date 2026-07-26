import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/useTheme';
import { radius } from '@/theme';
import { haptic } from '@/utils/feedback';

/**
 * A compact -/value/+ control. `value` is displayed as-is; callers own
 * formatting and clamping.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  suffix,
  width = 64,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  width?: number;
}) {
  const t = useTheme();
  const change = (dir: number) => {
    const next = Math.min(max, Math.max(min, +(value + dir * step).toFixed(3)));
    if (next !== value) {
      haptic.light();
      onChange(next);
    }
  };
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => change(-1)}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: t.surfaceAlt, opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={6}
      >
        <Ionicons name="remove" size={22} color={t.text} />
      </Pressable>
      <View style={{ minWidth: width, alignItems: 'center' }}>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>
          {value}
          {suffix ? <Text style={{ color: t.dim, fontSize: 13 }}> {suffix}</Text> : null}
        </Text>
      </View>
      <Pressable
        onPress={() => change(1)}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: t.surfaceAlt, opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={6}
      >
        <Ionicons name="add" size={22} color={t.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
