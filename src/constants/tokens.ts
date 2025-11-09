export const tokens = {
  radius: { sm: 16, md: 24, lg: 32 },
  blurPx: { card: 24 },
  glass: { bg: 'rgba(255,255,255,0.06)' },
  border: { inner: 'rgba(255,255,255,0.25)' },
  shadow: { outer: 'rgba(0,0,0,0.10)' },
  spacing: { grid: 8, gap: 12, gapLg: 16, inset: 16, insetLg: 20 },
  duration: { fast: 120, base: 180, slow: 200 },
} as const;

export type Tokens = typeof tokens;
