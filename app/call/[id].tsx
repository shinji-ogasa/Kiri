import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.safeArea}>
      <GlassCard style={styles.card} surfaceLevel={2}>
        <Text style={styles.title}>Call (DM)</Text>
        <Text style={styles.description}>通話シグナリング/メディアストリームは今後実装予定です。</Text>
        <Text style={styles.identifier}>相手 ID: {id}</Text>
        <View style={styles.controls}>
          <Pressable style={styles.controlButton}>
            <Text style={styles.controlLabel}>マイク</Text>
          </Pressable>
          <Pressable style={styles.controlButton}>
            <Text style={styles.controlLabel}>カメラ</Text>
          </Pressable>
          <Pressable style={[styles.controlButton, styles.danger]}>
            <Text style={styles.controlLabel}>切断</Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000102',
    padding: tokens.spacing.gapLg * 2,
    justifyContent: 'center',
  },
  card: {
    gap: tokens.spacing.gap,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  identifier: {
    color: '#C3F0FF',
    fontSize: 15,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.gapLg,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: tokens.radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  danger: {
    backgroundColor: '#FF6B6B',
  },
  controlLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
