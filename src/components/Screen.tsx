import React from 'react';
import { ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { spacing } from '@/theme';

/** Full-bleed themed screen background with safe-area handling. */
export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  contentStyle,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const t = useTheme();
  const pad = padded ? { paddingHorizontal: spacing.lg } : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[pad, { paddingBottom: spacing.xxl * 2 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: t.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.dim, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
