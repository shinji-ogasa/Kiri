import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';
import { markRoomRead, sendAttachmentMessage } from '@/features/chat/api';
import { useRoomMessages } from '@/features/chat/hooks/useRoomMessages';
import { useTypingIndicator } from '@/features/chat/hooks/useTypingIndicator';
import { fetchRoomInfo } from '@/features/rooms/api';
import { useRoomsStore } from '@/store/useRoomsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Room } from '@/types/room';

export default function DmScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { messages, loading, error, sendMessage } = useRoomMessages(roomId);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const userId = profile?.user_id ?? session?.user?.id;
  const markReadLocal = useRoomsStore((state) => state.markReadLocal);
  const { typingUsers, setTypingState } = useTypingIndicator(roomId, userId ?? undefined);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchRoomInfo(roomId)
      .then(setRoom)
      .catch((err) => setRoomError((err as Error).message));
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  useEffect(() => {
    if (!userId || !roomId || messages.length === 0) return;
    markRoomRead(roomId, userId).catch(() => {});
    markReadLocal(roomId);
  }, [messages.length, userId, roomId, markReadLocal]);

  const handleSend = async (text: string) => {
    if (!userId) throw new Error('セッションが無効です');
    await sendMessage(text, userId);
  };

  const handleAttachment = async (payload: { uri: string; mimeType?: string; type: 'image' | 'file'; name?: string | null }) => {
    if (!userId || !roomId) throw new Error('セッションが無効です');
    await sendAttachmentMessage(roomId, userId, payload);
  };

  const typingMessage = typingUsers.length > 0 ? '入力中…' : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ダイレクトメッセージ</Text>
          <Text style={styles.subtitle}>Room ID: {roomId}</Text>
          {room?.created_at && (
            <Text style={styles.metaText}>
              開始: {new Date(room.created_at).toLocaleDateString()}
            </Text>
          )}
          {typingMessage && <Text style={styles.typing}>{typingMessage}</Text>}
        </View>
        <Link href={`/call/${roomId}`} style={styles.callLink}>
          通話画面
        </Link>
      </View>

      {roomError && <Text style={styles.error}>{roomError}</Text>}

      <GlassCard style={styles.chatCard}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color="#5AC4FF" />
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          style={styles.list}
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              text={item.text ?? (item.file_url ? '添付ファイル' : '')}
              timestamp={item.created_at}
              isOwn={item.sender === userId}
            />
          )}
          contentContainerStyle={styles.messages}
        />
      </GlassCard>

      <MessageComposer
        onSend={handleSend}
        onSendAttachment={handleAttachment}
        onTypingStateChange={setTypingState}
        disabled={!userId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020203',
  },
  header: {
    paddingHorizontal: tokens.spacing.gapLg * 1.5,
    paddingVertical: tokens.spacing.gap,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontSize: 12,
  },
  typing: {
    color: '#5AC4FF',
    marginTop: 2,
    fontSize: 12,
  },
  callLink: {
    color: '#5AC4FF',
    fontWeight: '600',
  },
  chatCard: {
    flex: 1,
    marginHorizontal: tokens.spacing.gapLg * 1.5,
    marginBottom: tokens.spacing.gap,
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  error: {
    color: '#FF6B6B',
    paddingHorizontal: tokens.spacing.gap,
    marginBottom: tokens.spacing.gap,
  },
  messages: {
    paddingBottom: tokens.spacing.gap,
  },
  list: {
    flexGrow: 1,
  },
});
