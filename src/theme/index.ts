import { ThemeMode } from '@/types';

export interface Theme {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  track: string;
  text: string;
  dim: string;
  faint: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  /** Categorical palette for muscle groups / chart series. */
  series: string[];
}

const seriesPalette = [
  '#FF5A1F', // orange (primary)
  '#3B82F6', // blue
  '#22C55E', // green
  '#A855F7', // purple
  '#EAB308', // yellow
  '#EC4899', // pink
  '#14B8A6', // teal
];

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0B0F14',
  surface: '#151B23',
  surfaceAlt: '#1C232D',
  border: '#28313D',
  track: '#232C36',
  text: '#F2F5F8',
  dim: '#8A97A6',
  faint: '#5C6875',
  primary: '#FF5A1F',
  primaryDark: '#D8430F',
  onPrimary: '#FFFFFF',
  accent: '#F5A623',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#EAB308',
  series: seriesPalette,
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF0F3',
  border: '#D9DEE5',
  track: '#E3E8EE',
  text: '#0B0F14',
  dim: '#5A6472',
  faint: '#8A97A6',
  primary: '#E8480F',
  primaryDark: '#B8380B',
  onPrimary: '#FFFFFF',
  accent: '#D98315',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#CA8A04',
  series: seriesPalette,
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

export const muscleColor = (theme: Theme, index: number) =>
  theme.series[index % theme.series.length];

/** Consistent spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};
