import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/theme';

// ratio: 0..1
export default function ProgressBar({ ratio = 0, color = colors.primary, height = 12 }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.track,
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
});
