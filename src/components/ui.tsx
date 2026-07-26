import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/useTheme';
import { radius, spacing, Theme } from '@/theme';

// --- Text ------------------------------------------------------------------

type TxtProps = TextProps & {
  color?: string;
  size?: number;
  weight?: '400' | '500' | '600' | '700' | '800' | '900';
  dim?: boolean;
  faint?: boolean;
  center?: boolean;
};

export function Txt({
  color,
  size = 15,
  weight = '500',
  dim,
  faint,
  center,
  style,
  ...rest
}: TxtProps) {
  const t = useTheme();
  const c = color ?? (faint ? t.faint : dim ? t.dim : t.text);
  return (
    <Text
      style={[
        { color: c, fontSize: size, fontWeight: weight },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}

// --- Card ------------------------------------------------------------------

export function Card({
  style,
  padded = true,
  children,
  ...rest
}: ViewProps & { padded?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
        },
        padded && { padding: spacing.lg },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// --- Button ----------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  fullWidth,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const heights: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 64 };
  const fonts: Record<ButtonSize, number> = { sm: 14, md: 17, lg: 20 };

  const bg: Record<ButtonVariant, string> = {
    primary: t.primary,
    secondary: t.surfaceAlt,
    danger: t.danger,
    ghost: 'transparent',
  };
  const fg: Record<ButtonVariant, string> = {
    primary: t.onPrimary,
    secondary: t.text,
    danger: '#fff',
    ghost: t.primary,
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: heights[size],
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          backgroundColor: bg[variant],
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          borderColor: t.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fonts[size] + 3} color={fg[variant]} />}
          <Text style={{ color: fg[variant], fontSize: fonts[size], fontWeight: '800' }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// --- Icon button -----------------------------------------------------------

export function IconButton({
  name,
  onPress,
  color,
  size = 22,
  bg,
  style,
  disabled,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        {
          width: size + 20,
          height: size + 20,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg ?? 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? t.text} />
    </Pressable>
  );
}

// --- Pill / tag ------------------------------------------------------------

export function Pill({
  label,
  color,
  bg,
  active,
  onPress,
}: {
  label: string;
  color?: string;
  bg?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const c = active ? t.onPrimary : color ?? t.dim;
  const background = active ? t.primary : bg ?? t.surfaceAlt;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        backgroundColor: background,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: c, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

// --- Section header --------------------------------------------------------

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={{ color: t.dim, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: t.primary, fontWeight: '700', fontSize: 14 }}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// --- Stat tile -------------------------------------------------------------

export function StatTile({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}) {
  const t = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: t.surface, borderColor: t.border }]}>
      {icon && <Ionicons name={icon} size={18} color={color ?? t.primary} />}
      <Text style={{ color: t.text, fontSize: 26, fontWeight: '900', marginTop: 4 }}>
        {value}
        {unit ? <Text style={{ fontSize: 14, color: t.dim }}> {unit}</Text> : null}
      </Text>
      <Text style={{ color: t.dim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// --- Divider / empty -------------------------------------------------------

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

export function EmptyState({
  icon = 'barbell-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={t.faint} />
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 17, marginTop: spacing.md }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: t.dim, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function makeStyles(_t: Theme) {
  return StyleSheet.create({});
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    minWidth: 90,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
