import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

/** Simple pulsing placeholder block. */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { backgroundColor: theme.colors.surfaceVariant, opacity }, style]}
    />
  );
}

export function ProductListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton style={{ width: 52, height: 52, borderRadius: 10 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton style={{ height: 14, width: '70%' }} />
            <Skeleton style={{ height: 10, width: '40%' }} />
          </View>
          <Skeleton style={{ height: 20, width: 36 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 6 },
});
