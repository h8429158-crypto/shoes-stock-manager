import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  tint?: string;
  onPress?: () => void;
}

/** Stat tile: one headline number with a label — no chart chrome. */
export function SummaryCard({ icon, label, value, tint, onPress }: Props) {
  const theme = useTheme();
  const color = tint ?? theme.colors.primary;
  return (
    <Card mode="contained" style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: color + '1E' }]}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <Text variant="titleLarge" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%' },
  content: { gap: 2, paddingVertical: 12 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: { fontWeight: '700' },
});
