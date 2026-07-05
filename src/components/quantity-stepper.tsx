import React from 'react';
import { StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function QuantityStepper({ value, onChange, min = 1, max = 999999, step = 1 }: Props) {
  const theme = useTheme();

  const bump = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  return (
    <View style={styles.row}>
      <IconButton mode="contained-tonal" icon="minus" onPress={() => bump(-step)} disabled={value <= min} />
      <RNTextInput
        style={[
          styles.input,
          { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant },
        ]}
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(t) => {
          const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
        selectTextOnFocus
      />
      <IconButton mode="contained-tonal" icon="plus" onPress={() => bump(step)} disabled={value >= max} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  input: {
    minWidth: 88,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
});
