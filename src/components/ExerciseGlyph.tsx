import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { muscleColor, radius } from '@/theme';
import { MUSCLE_GROUPS, MuscleGroup } from '@/types';

// Highlight shapes per muscle group, drawn over a shared body silhouette in a
// 40×64 viewBox. Stylised, not anatomical — a fast visual cue, not a diagram.
function highlights(muscle: MuscleGroup, color: string): React.ReactNode {
  const fill = color;
  switch (muscle) {
    case 'chest':
      return <Ellipse cx={20} cy={19} rx={7.5} ry={4.5} fill={fill} />;
    case 'back':
      return (
        <>
          <Rect x={12.5} y={15} width={15} height={13} rx={3} fill={fill} />
          <Circle cx={11} cy={15} r={2.6} fill={fill} />
          <Circle cx={29} cy={15} r={2.6} fill={fill} />
        </>
      );
    case 'shoulders':
      return (
        <>
          <Circle cx={11} cy={15} r={3.4} fill={fill} />
          <Circle cx={29} cy={15} r={3.4} fill={fill} />
        </>
      );
    case 'biceps':
      return (
        <>
          <Rect x={6} y={15} width={4.6} height={8} rx={2.3} fill={fill} />
          <Rect x={29.4} y={15} width={4.6} height={8} rx={2.3} fill={fill} />
        </>
      );
    case 'triceps':
      return (
        <>
          <Rect x={6} y={16} width={4.6} height={9} rx={2.3} fill={fill} />
          <Rect x={29.4} y={16} width={4.6} height={9} rx={2.3} fill={fill} />
        </>
      );
    case 'legs':
      return (
        <>
          <Rect x={13} y={34} width={6} height={13} rx={3} fill={fill} />
          <Rect x={21} y={34} width={6} height={13} rx={3} fill={fill} />
        </>
      );
    case 'core':
      return <Rect x={14} y={23} width={12} height={8} rx={3} fill={fill} />;
    default:
      return null;
  }
}

/** A small figure tile with the exercise's muscle group highlighted. */
export function ExerciseGlyph({
  muscle,
  size = 44,
}: {
  muscle: MuscleGroup;
  size?: number;
}) {
  const t = useTheme();
  const idx = MUSCLE_GROUPS.indexOf(muscle);
  const color = muscleColor(t, idx >= 0 ? idx : 0);
  const base = t.mode === 'dark' ? t.track : t.border;

  const svgH = size - 8;
  const svgW = svgH * 0.625;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: t.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={svgW} height={svgH} viewBox="0 0 40 64">
        {/* base silhouette */}
        <G>
          <Circle cx={20} cy={7} r={5} fill={base} />
          <Rect x={12} y={13} width={16} height={20} rx={5} fill={base} />
          <Rect x={6} y={14} width={5} height={18} rx={2.5} fill={base} />
          <Rect x={29} y={14} width={5} height={18} rx={2.5} fill={base} />
          <Rect x={13} y={33} width={6} height={24} rx={3} fill={base} />
          <Rect x={21} y={33} width={6} height={24} rx={3} fill={base} />
        </G>
        {/* highlighted muscle */}
        {highlights(muscle, color)}
      </Svg>
    </View>
  );
}
