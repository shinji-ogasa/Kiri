import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.safeArea}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Room</Text>
        <Text style={styles.description}>
          ここにグループチャット <Text style={styles.highlight}>{id}</Text> のメッセージが表示されます。
        </Text>
        <Text style={styles.note}>メッセージリスト/Composer/既読更新は今後実装します。</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020203',
    padding: tokens.spacing.gapLg * 2,
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
    fontSize: 15,
    lineHeight: 22,
  },
  highlight: {
    color: '#5AC4FF',
  },
  note: {
    marginTop: tokens.spacing.gap,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});
