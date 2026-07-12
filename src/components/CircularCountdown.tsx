import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { Txt } from '@/components/ui';
import { clock } from '@/utils/date';

/** A circular countdown ring showing remaining rest time. */
export function CircularCountdown({
  remaining,
  total,
  size = 108,
  stroke = 9,
}: {
  remaining: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const offset = c * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt size={30} weight="900">
        {clock(remaining)}
      </Txt>
    </View>
  );
}
