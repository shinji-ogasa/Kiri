import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

import { tokens } from '@/constants/tokens';

type GlassCardProps = ViewProps & {
  children: ReactNode;
  /**
   * Surface level 1 = standard card, 2 = emphasized (影/濃度アップ)。
   */
  surfaceLevel?: 1 | 2;
};

export function GlassCard({ children, style, surfaceLevel = 1, ...rest }: GlassCardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.wrapper,
        surfaceLevel === 2 && styles.emphasis,
        style,
      ]}>
      <BlurView
        intensity={surfaceLevel === 2 ? 70 : 50}
        tint="default"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border.inner,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
    backgroundColor: 'transparent',
  },
  emphasis: {
    borderRadius: tokens.radius.lg,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.glass.bg,
  },
  content: {
    padding: tokens.spacing.inset,
    flexGrow: 1,
  },
});
