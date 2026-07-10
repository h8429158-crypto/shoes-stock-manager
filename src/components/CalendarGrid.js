import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme/theme';
import { datesInMonth, firstWeekdayOfMonth } from '../logic/dates';

const STATUS_COLORS = {
  green: colors.green,
  yellow: colors.yellow,
  red: colors.red,
  empty: colors.empty,
  future: 'transparent',
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// monthKey: 'YYYY-MM'; statusFor: (dateStr) => 'green'|'yellow'|'red'|'empty'|'future'
export default function CalendarGrid({ monthKey, statusFor, today }) {
  const dates = datesInMonth(monthKey);
  const leadingBlanks = firstWeekdayOfMonth(monthKey);
  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (const d of dates) cells.push(d);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`wd-${i}`} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <View key={`blank-${idx}`} style={styles.cell} />;
          const status = statusFor(dateStr);
          const dayNum = Number(dateStr.slice(-2));
          const isToday = dateStr === today;
          return (
            <View key={dateStr} style={styles.cell}>
              <View
                style={[
                  styles.day,
                  { backgroundColor: STATUS_COLORS[status] || colors.empty },
                  status === 'future' && styles.dayFuture,
                  isToday && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    (status === 'green' || status === 'yellow' || status === 'red') &&
                      styles.dayTextFilled,
                  ]}
                >
                  {dayNum}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: font.xs,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFuture: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  dayToday: { borderWidth: 2, borderColor: colors.text },
  dayText: { color: colors.textDim, fontSize: font.sm, fontWeight: '700' },
  dayTextFilled: { color: '#0B0F14' },
});
