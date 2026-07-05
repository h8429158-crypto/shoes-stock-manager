import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

const brand = {
  primary: '#1F6FEB',
  secondary: '#0D9488',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    secondary: brand.secondary,
    background: '#F6F7F9',
    surface: '#FFFFFF',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6CA6FF',
    secondary: '#2DD4BF',
    background: '#0F1115',
    surface: '#171A21',
  },
};

export const statusColors = {
  in_stock: '#16A34A',
  low_stock: '#D97706',
  out_of_stock: '#DC2626',
} as const;

/**
 * Chart series colors, validated per mode with the dataviz palette checker
 * (lightness band, chroma, CVD separation, contrast vs surface).
 * series1 = stock in / value; series2 = stock out.
 */
export const chartColors = {
  light: { series1: '#1F6FEB', series2: '#D97706' },
  dark: { series1: '#4C8DF8', series2: '#D97706' },
} as const;
