import { Platform } from 'react-native';

import { tokens } from '@/constants/tokens';

export const palette = {
  accent: '#5AC4FF',
  accentStrong: '#3BA7EB',
  danger: '#FF6B6B',
  success: '#7CF5C2',
  textOnDark: '#F6FAFF',
  textMuted: 'rgba(255,255,255,0.72)',
  shadow: 'rgba(0,0,0,0.45)',
};

export const Colors = {
  light: {
    text: palette.textOnDark,
    background: '#02050A',
    tint: palette.accent,
    icon: 'rgba(255,255,255,0.85)',
    tabIconDefault: 'rgba(255,255,255,0.45)',
    tabIconSelected: palette.accent,
    surface0: '#010307',
    surface1: 'rgba(255,255,255,0.05)',
    surface2: 'rgba(255,255,255,0.12)',
    border: tokens.border.inner,
    accent: palette.accent,
    accentStrong: palette.accentStrong,
    danger: palette.danger,
    success: palette.success,
  },
  dark: {
    text: palette.textOnDark,
    background: '#010204',
    tint: palette.accent,
    icon: 'rgba(255,255,255,0.8)',
    tabIconDefault: 'rgba(255,255,255,0.4)',
    tabIconSelected: palette.accent,
    surface0: '#010204',
    surface1: 'rgba(255,255,255,0.04)',
    surface2: 'rgba(255,255,255,0.1)',
    border: tokens.border.inner,
    accent: palette.accent,
    accentStrong: palette.accentStrong,
    danger: palette.danger,
    success: palette.success,
  },
};

export type ThemeScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'SF Pro Display',
    serif: 'Times New Roman',
    rounded: 'SF Pro Rounded',
    mono: 'SF Mono',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  default: {
    sans: 'system-ui',
    serif: 'serif',
    rounded: 'system-ui',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, 'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Hiragino Maru Gothic ProN', 'Noto Sans JP', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const createTheme = (scheme: ThemeScheme = 'light') => ({
  scheme,
  colors: Colors[scheme],
  tokens,
});

export type KiriTheme = ReturnType<typeof createTheme>;
