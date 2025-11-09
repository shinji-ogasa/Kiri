import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

const mockThreads = [
  { id: 'room-123456', name: 'グループ 123456', preview: '最新メッセージがここに表示されます', unread: 3 },
  { id: 'dm-12345678', name: 'DM 12345678', preview: 'DM の下書きです', unread: 0 },
];

export default function MessagesScreen() {
  const data = useMemo(() => mockThreads, []);

  return (
    <View style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <Text style={styles.threadName}>{item.name}</Text>
              {item.unread > 0 && <Text style={styles.unreadBadge}>{item.unread}</Text>}
            </View>
            <Text style={styles.preview}>{item.preview}</Text>
          </GlassCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: tokens.spacing.gap }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030304',
  },
  listContent: {
    padding: tokens.spacing.gapLg * 2,
    paddingBottom: 32,
  },
  threadCard: {
    gap: tokens.spacing.gap,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 28,
    paddingVertical: 4,
    textAlign: 'center',
    borderRadius: 999,
    backgroundColor: '#FF8E8E',
    color: '#020202',
    fontWeight: '700',
  },
  preview: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
});
