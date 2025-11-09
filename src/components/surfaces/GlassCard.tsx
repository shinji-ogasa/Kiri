import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

import { tokens } from '@/constants/tokens';

type GlassCardProps = ViewProps & {
  children: ReactNode;
  /**
   * Surface level 1 = standard card, 2 = emphasized (shadow/opacity強化)。
   */
  surfaceLevel?: 1 | 2;
};

export function GlassCard({ children, style, surfaceLevel = 1, ...rest }: GlassCardProps) {
  const Container = Platform.OS === 'ios' ? BlurView : View;
  const extraProps =
    Platform.OS === 'ios'
      ? {
          intensity: surfaceLevel === 2 ? 60 : 40,
          tint: 'default' as const,
        }
      : {};

  return (
    <Container
      {...extraProps}
      {...rest}
      style={[
        styles.base,
        surfaceLevel === 2 && styles.emphasis,
        style,
      ]}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: tokens.spacing.inset,
    borderRadius: tokens.radius.md,
    backgroundColor: Platform.select({
      android: tokens.glass.bg,
      ios: 'transparent',
      default: tokens.glass.bg,
    }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border.inner,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  emphasis: {
    borderRadius: tokens.radius.lg,
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 6,
  },
});
