import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { Txt } from '@/components/ui';

export interface Point {
  x: number; // numeric domain (e.g. timestamp)
  y: number;
}

export interface LineSeries {
  color: string;
  points: Point[];
  label?: string;
}

/** Multi-series line chart with a light grid and end-point dots. */
export function LineChart({
  series,
  height = 200,
  width,
  yFormat = (n) => String(Math.round(n)),
  xLabels,
}: {
  series: LineSeries[];
  height?: number;
  width: number;
  yFormat?: (n: number) => string;
  xLabels?: { x: number; label: string }[];
}) {
  const t = useTheme();
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const plotW = Math.max(1, width - padL - padR);
  const plotH = Math.max(1, height - padT - padB);

  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Txt dim>Not enough data yet</Txt>
      </View>
    );
  }

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minX === maxX) maxX = minX + 1;
  // pad the y-domain by ~8% so lines don't touch the edges
  const span = maxY - minY || Math.abs(maxY) || 1;
  minY -= span * 0.08;
  maxY += span * 0.08;

  const sx = (x: number) => padL + ((x - minX) / (maxX - minX)) * plotW;
  const sy = (y: number) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const gridYs = [0, 0.5, 1].map((f) => minY + f * (maxY - minY));

  return (
    <Svg width={width} height={height}>
      {/* grid + y labels */}
      {gridYs.map((gy, i) => (
        <G key={i}>
          <Line
            x1={padL}
            x2={width - padR}
            y1={sy(gy)}
            y2={sy(gy)}
            stroke={t.border}
            strokeWidth={1}
          />
          <SvgText
            x={padL - 6}
            y={sy(gy) + 3}
            fontSize={9}
            fill={t.faint}
            textAnchor="end"
          >
            {yFormat(gy)}
          </SvgText>
        </G>
      ))}

      {/* x labels */}
      {xLabels?.map((xl, i) => (
        <SvgText
          key={i}
          x={sx(xl.x)}
          y={height - 6}
          fontSize={9}
          fill={t.faint}
          textAnchor="middle"
        >
          {xl.label}
        </SvgText>
      ))}

      {/* series */}
      {series.map((s, si) => {
        if (s.points.length === 0) return null;
        const pts = [...s.points].sort((a, b) => a.x - b.x);
        const poly = pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');
        return (
          <G key={si}>
            <Polyline
              points={poly}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {pts.map((p, pi) => (
              <Circle
                key={pi}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={pi === pts.length - 1 ? 4 : 2.5}
                fill={s.color}
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
}

/** Simple vertical categorical bar chart. */
export function BarChart({
  data,
  height = 200,
  width,
  color,
  valueFormat = (n) => String(Math.round(n)),
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  width: number;
  color?: string;
  valueFormat?: (n: number) => string;
}) {
  const t = useTheme();
  const padT = 18;
  const padB = 26;
  const plotH = Math.max(1, height - padT - padB);
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const slot = width / n;
  const barW = Math.min(38, slot * 0.6);

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const h = (d.value / max) * plotH;
        const x = i * slot + (slot - barW) / 2;
        const y = padT + (plotH - h);
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              rx={4}
              fill={d.color ?? color ?? t.primary}
            />
            {d.value > 0 && (
              <SvgText
                x={x + barW / 2}
                y={y - 5}
                fontSize={9}
                fill={t.dim}
                textAnchor="middle"
              >
                {valueFormat(d.value)}
              </SvgText>
            )}
            <SvgText
              x={x + barW / 2}
              y={height - 8}
              fontSize={10}
              fill={t.faint}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/**
 * GitHub-style calendar heatmap. `intensity` maps a YYYY-MM-DD key to a value
 * in [0,1]. Renders the most recent `weeks` columns ending today.
 */
export function CalendarHeatmap({
  intensity,
  width,
  weeks = 16,
}: {
  intensity: (key: string) => number;
  width: number;
  weeks?: number;
}) {
  const t = useTheme();
  const gap = 3;
  const cell = Math.max(8, Math.floor((width - (weeks - 1) * gap) / weeks));
  const rows = 7;
  const height = rows * cell + (rows - 1) * gap + 16;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // start on the Monday of the earliest visible week
  const start = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow - (weeks - 1) * 7);

  const key = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const lerp = (v: number) => {
    // blend track -> primary based on intensity
    if (v <= 0) return t.track;
    if (v < 0.34) return t.primaryDark + '66';
    if (v < 0.67) return t.primaryDark;
    return t.primary;
  };

  const cells: React.ReactNode[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let r = 0; r < rows; r++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + r);
      if (d > today) continue;
      const v = intensity(key(d));
      cells.push(
        <Rect
          key={`${w}-${r}`}
          x={w * (cell + gap)}
          y={r * (cell + gap)}
          width={cell}
          height={cell}
          rx={2}
          fill={lerp(v)}
        />
      );
    }
  }

  return (
    <Svg width={width} height={height}>
      {cells}
    </Svg>
  );
}
