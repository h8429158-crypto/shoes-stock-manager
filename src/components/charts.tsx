import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { chartColors } from '@/lib/theme';

/**
 * Lightweight, dependency-free charts.
 * Design rules: length encodes magnitude (single hue per series), 2px gaps
 * between marks, direct labels on ends, no dual axes, recessive gridwork.
 */

export function useSeriesColors() {
  const theme = useTheme();
  return theme.dark ? chartColors.dark : chartColors.light;
}

// ---------------------------------------------------------------------------
// Horizontal bars: value by category
// ---------------------------------------------------------------------------

interface HBarDatum {
  label: string;
  value: number;
  /** preformatted value label, e.g. "$1,240.00" */
  valueLabel: string;
}

export function HorizontalBarChart({ data }: { data: HBarDatum[] }) {
  const theme = useTheme();
  const colors = useSeriesColors();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={{ gap: 10 }}>
      {data.map((d) => (
        <View key={d.label}>
          <View style={styles.hbarLabels}>
            <Text variant="labelMedium" numberOfLines={1} style={{ flex: 1 }}>
              {d.label}
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {d.valueLabel}
            </Text>
          </View>
          <View style={[styles.hbarTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View
              style={[
                styles.hbarFill,
                { width: `${Math.max(2, (d.value / max) * 100)}%`, backgroundColor: colors.series1 },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mirrored daily columns: stock in (up) vs stock out (down), last N days
// ---------------------------------------------------------------------------

export interface DailyFlow {
  /** short axis label shown under some columns, e.g. "12 Jun" */
  label: string;
  inQty: number;
  outQty: number;
}

export function MovementColumns({ data }: { data: DailyFlow[] }) {
  const theme = useTheme();
  const colors = useSeriesColors();
  const max = Math.max(1, ...data.flatMap((d) => [d.inQty, d.outQty]));
  const H = 56; // px per half

  return (
    <View>
      <View style={styles.legendRow}>
        <LegendSwatch color={colors.series1} label="Stock in" />
        <LegendSwatch color={colors.series2} label="Stock out" />
      </View>
      <View style={[styles.colRow, { height: H * 2 + 2 }]}>
        <View
          style={[
            styles.baseline,
            { top: H, backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        {data.map((d, i) => (
          <View key={i} style={styles.colSlot}>
            <View style={{ height: H, justifyContent: 'flex-end' }}>
              {d.inQty > 0 && (
                <View
                  style={{
                    height: Math.max(3, (d.inQty / max) * H),
                    backgroundColor: colors.series1,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              )}
            </View>
            <View style={{ height: 2 }} />
            <View style={{ height: H }}>
              {d.outQty > 0 && (
                <View
                  style={{
                    height: Math.max(3, (d.outQty / max) * H),
                    backgroundColor: colors.series2,
                    borderBottomLeftRadius: 3,
                    borderBottomRightRadius: 3,
                  }}
                />
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.axisRow}>
        {data.map((d, i) => (
          <View key={i} style={styles.colSlot}>
            {d.label ? (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, fontSize: 9, textAlign: 'center' }}
                numberOfLines={1}
              >
                {d.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hbarLabels: { flexDirection: 'row', gap: 8, marginBottom: 3 },
  hbarTrack: { height: 14, borderRadius: 4, overflow: 'hidden' },
  hbarFill: { height: '100%', borderRadius: 4 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  colRow: { flexDirection: 'row', alignItems: 'stretch', gap: 2 },
  colSlot: { flex: 1, minWidth: 4 },
  baseline: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  axisRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
});
