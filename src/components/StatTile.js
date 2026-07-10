import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme/theme';

export default function StatTile({ label, value, sub, accent = colors.text }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  value: { fontSize: font.xl, fontWeight: '800' },
  label: { color: colors.textDim, fontSize: font.xs, marginTop: 2, textAlign: 'center' },
  sub: { color: colors.textFaint, fontSize: font.xs, marginTop: 2 },
});
