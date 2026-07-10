import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme/theme';

// A wrapping row of selectable pills. Single-select.
export default function SegmentedPicker({ options, value, onChange, colorFor }) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const label = typeof opt === 'string' ? opt : opt.label;
        const val = typeof opt === 'string' ? opt : opt.value;
        const selected = val === value;
        const accent = colorFor ? colorFor(val) : colors.primary;
        return (
          <Pressable
            key={val}
            onPress={() => onChange(val)}
            style={[
              styles.pill,
              selected && { backgroundColor: accent, borderColor: accent },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs / 2 },
  pill: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    margin: spacing.xs / 2 + 2,
  },
  label: { color: colors.textDim, fontSize: font.sm, fontWeight: '600' },
  labelSelected: { color: '#06210F', fontWeight: '800' },
});
