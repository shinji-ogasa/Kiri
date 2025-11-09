import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

export default function DmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.safeArea}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>DM</Text>
        <Text style={styles.description}>
          アカウント ID <Text style={styles.highlight}>{id}</Text> との DM スレッドです。
        </Text>
        <Link href={`/call/${id}`} style={styles.callLink}>
          通話画面を開く
        </Link>
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
  callLink: {
    marginTop: tokens.spacing.gap,
    color: '#C3F0FF',
    fontWeight: '600',
  },
});
