import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme/theme';

// Standard screen frame: safe-area, dark background, optional scrolling body,
// optional title/subtitle header.
export default function Screen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  contentStyle,
  edges = ['top'],
}) {
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: [styles.content, contentStyle],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled',
      }
    : { style: [styles.content, contentStyle] };

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {(title || right) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      )}
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}

export function SectionTitle({ children, style }) {
  return <Text style={[styles.section, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: font.xxl, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: font.sm, marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2, flexGrow: 1 },
  section: {
    color: colors.textDim,
    fontSize: font.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
