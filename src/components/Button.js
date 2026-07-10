import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radius, spacing, font } from '../theme/theme';

// Large, thumb-friendly button. `variant` = 'primary' | 'secondary' | 'ghost' | 'danger'.
export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  icon = null,
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.bg : colors.text} />
      ) : (
        <View style={styles.row}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text
            style={[
              styles.text,
              isPrimary && styles.textPrimary,
              isDanger && styles.textDanger,
              isGhost && styles.textGhost,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: font.md, marginRight: spacing.sm },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  text: { color: colors.text, fontSize: font.md, fontWeight: '700' },
  textPrimary: { color: '#06210F' },
  textDanger: { color: colors.danger },
  textGhost: { color: colors.primary },
});
