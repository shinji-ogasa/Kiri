import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';
import { useRoomsStore } from '@/store/useRoomsStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function MessagesScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const initializing = useAuthStore((state) => state.initializing);
  const router = useRouter();
  const userId = profile?.user_id ?? session?.user?.id;
  const rooms = useRoomsStore((state) => state.rooms);
  const loading = useRoomsStore((state) => state.loading);
  const error = useRoomsStore((state) => state.error);
  const subscribe = useRoomsStore((state) => state.subscribe);
  const unsubscribe = useRoomsStore((state) => state.unsubscribe);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!initializing && !session) {
      router.replace('/(auth)/signin');
    }
  }, [initializing, session, router]);

  useEffect(() => {
    if (userId) {
      subscribe(userId);
      return () => {
        unsubscribe();
      };
    }
  }, [userId, subscribe, unsubscribe]);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await subscribe(userId);
    setRefreshing(false);
  };

  const navigateToRoom = (roomId: string, kind: 'group' | 'dm') => {
    router.push(kind === 'group' ? `/room/${roomId}` : `/dm/${roomId}`);
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Link href="/connect" style={styles.link}>
          部屋/DMに参加
        </Link>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color="#5AC4FF" />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && rooms.length === 0 && (
        <Text style={styles.empty}>まだ部屋がありません。Connect から参加しましょう。</Text>
      )}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={rooms}
        keyExtractor={(item) => item.room.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <GlassCard style={[styles.threadCard, item.hasUnread && styles.unreadCard]}>
            <Pressable onPress={() => navigateToRoom(item.room.id, item.room.kind)}>
              <View style={styles.threadHeader}>
                <Text style={styles.threadName}>
                  {item.room.kind === 'group'
                    ? `グループ ${item.room.code6 ?? ''}`
                    : 'ダイレクトメッセージ'}
                </Text>
                <Text style={styles.roleBadge}>{item.role}</Text>
              </View>
              <Text style={styles.preview}>
                {item.lastMessage?.text
                  ? item.lastMessage.text
                  : item.lastMessage?.file_url
                    ? 'ファイルメッセージ'
                    : 'まだメッセージはありません'}
              </Text>
              {item.lastMessage?.created_at && (
                <Text style={styles.time}>
                  {new Date(item.lastMessage.created_at).toLocaleString()}
                </Text>
              )}
            </Pressable>
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
    padding: tokens.spacing.gapLg * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.gapLg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  link: {
    color: '#5AC4FF',
    fontWeight: '600',
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  error: {
    color: '#FF6B6B',
    marginBottom: tokens.spacing.gap,
  },
  empty: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: tokens.spacing.gap,
  },
  listContent: {
    paddingBottom: 120,
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
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  preview: {
    color: 'rgba(255,255,255,0.75)',
  },
  time: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  unreadCard: {
    borderColor: '#5AC4FF',
    borderWidth: 1,
  },
});
