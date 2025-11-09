import React, { createContext, useContext, useMemo } from 'react';

import { Colors, KiriTheme, ThemeScheme, createTheme } from '@/constants/theme';

type ThemeContextValue = KiriTheme;

const KiriThemeContext = createContext<ThemeContextValue | null>(null);

type ProviderProps = {
  scheme: ThemeScheme;
  children: React.ReactNode;
};

export function KiriThemeProvider({ scheme, children }: ProviderProps) {
  const value = useMemo(() => createTheme(scheme), [scheme]);
  return <KiriThemeContext.Provider value={value}>{children}</KiriThemeContext.Provider>;
}

export function useKiriTheme() {
  const ctx = useContext(KiriThemeContext);
  if (!ctx) {
    throw new Error('useKiriTheme must be used within KiriThemeProvider');
  }
  return ctx;
}

export function getThemeColors(scheme: ThemeScheme) {
  return Colors[scheme];
}
