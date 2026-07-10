import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme/theme';

// Lightweight vertical bar chart built from plain Views (no chart library).
// data: [{ label, value, color? }]
export default function BarChart({ data, height = 140, barColor = colors.primary }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 22));
          return (
            <View key={`${d.label}-${i}`} style={styles.col}>
              <Text style={styles.value} numberOfLines={1}>
                {d.value > 0 ? d.value : ''}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: d.color || barColor },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={`l-${d.label}-${i}`} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '62%', borderRadius: radius.sm, minWidth: 8 },
  value: { color: colors.textDim, fontSize: 10, marginBottom: 3 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  label: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: font.xs },
});
