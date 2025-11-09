import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';
import { markRoomRead, sendAttachmentMessage } from '@/features/chat/api';
import { useRoomMessages } from '@/features/chat/hooks/useRoomMessages';
import { useTypingIndicator } from '@/features/chat/hooks/useTypingIndicator';
import {
  addMemberByAccountId,
  fetchRoomInfo,
  fetchRoomMembers,
  inviteAccountsToRoom,
  updateRoomSettings,
} from '@/features/rooms/api';
import { useRoomsStore } from '@/store/useRoomsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Room } from '@/types/room';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { messages, loading, error, sendMessage } = useRoomMessages(roomId);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPersistent, setIsPersistent] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const userId = profile?.user_id ?? session?.user?.id;
  const markReadLocal = useRoomsStore((state) => state.markReadLocal);
  const { typingUsers, setTypingState } = useTypingIndicator(roomId, userId ?? undefined);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchRoomInfo(roomId)
      .then((data) => {
        setRoom(data);
        setIsPublic(data.is_public ?? true);
        setIsPersistent(data.is_persistent ?? false);
      })
      .catch((err) => setRoomError((err as Error).message));
  }, [roomId]);

  const refreshMembers = useCallback(() => {
    if (!roomId || room?.kind !== 'group') return;
    fetchRoomMembers(roomId)
      .then(setMembers)
      .catch((err) => setMembersError((err as Error).message));
  }, [roomId, room?.kind]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!userId || !roomId || messages.length === 0) return;
    markRoomRead(roomId, userId).catch(() => {});
    markReadLocal(roomId);
  }, [messages.length, userId, roomId, markReadLocal]);

  const handleSend = async (text: string) => {
    if (!userId) {
      throw new Error('セッションが無効です');
    }
    await sendMessage(text, userId);
  };

  const handleAttachment = async (payload: { uri: string; mimeType?: string; type: 'image' | 'file'; name?: string | null }) => {
    if (!userId || !roomId) {
      throw new Error('セッションが無効です');
    }
    await sendAttachmentMessage(roomId, userId, payload);
  };

  const handleSaveSettings = async () => {
    if (!roomId) return;
    setSavingSettings(true);
    try {
      const updated = await updateRoomSettings(roomId, {
        is_public: isPublic,
        is_persistent: isPersistent,
      });
      setRoom(updated);
    } catch (err) {
      setRoomError((err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInvite = async () => {
    if (!roomId || !userId) return;
    const ids = inviteInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => /^\d{8}$/.test(item));
    if (ids.length === 0) return;
    await inviteAccountsToRoom(roomId, ids, userId);
    setInviteInput('');
    refreshMembers();
  };

  const handleDirectAdd = async () => {
    if (!roomId || !inviteInput) return;
    await addMemberByAccountId(roomId, inviteInput.trim());
    setInviteInput('');
    refreshMembers();
  };

  const isAdmin = members.some((member) => member.user_id === userId && member.role === 'admin');

  const typingNames = useMemo(() => {
    if (!members.length) return typingUsers;
    return members
      .filter((member) => typingUsers.includes(member.user_id))
      .map((member) => member.profiles?.username ?? member.user_id.slice(0, 8));
  }, [members, typingUsers]);

  const typingMessage =
    typingNames.length > 0
      ? `${typingNames.join(', ')} が入力中...`
      : typingUsers.length > 0
        ? '誰かが入力中...'
        : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>グループチャット</Text>
        {room?.code6 && <Text style={styles.subtitle}>コード: {room.code6}</Text>}
        {typingMessage && <Text style={styles.typing}>{typingMessage}</Text>}
      </View>

      {roomError && <Text style={styles.error}>{roomError}</Text>}
      {membersError && <Text style={styles.error}>{membersError}</Text>}

      {room?.kind === 'group' && isAdmin && (
        <GlassCard style={styles.managementCard}>
          <Text style={styles.sectionTitle}>グループ設定</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>公開グループ</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>永続化</Text>
            <Switch value={isPersistent} onValueChange={setIsPersistent} />
          </View>
          <View style={styles.inviteRow}>
            <TextInput
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder="招待または追加する 8桁ID"
              style={styles.inviteInput}
              keyboardType="number-pad"
              maxLength={64}
            />
            <Pressable style={styles.inviteButton} onPress={handleInvite}>
              <Text style={styles.inviteButtonLabel}>招待</Text>
            </Pressable>
            <Pressable style={styles.inviteButton} onPress={handleDirectAdd}>
              <Text style={styles.inviteButtonLabel}>追加</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.saveButton, savingSettings && styles.buttonDisabled]}
            onPress={handleSaveSettings}
            disabled={savingSettings}>
            <Text style={styles.saveButtonLabel}>{savingSettings ? '保存中...' : '設定を保存'}</Text>
          </Pressable>
        </GlassCard>
      )}

      {room?.kind === 'group' && (
        <GlassCard style={styles.membersCard}>
          <Text style={styles.sectionTitle}>メンバー</Text>
          {members.map((member) => (
            <View key={member.user_id} style={styles.memberRow}>
              <Text style={styles.memberName}>
                {member.profiles?.username ?? member.user_id.slice(0, 8)}
              </Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          ))}
          {members.length === 0 && <Text style={styles.empty}>メンバーなし</Text>}
        </GlassCard>
      )}

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
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  typing: {
    color: '#5AC4FF',
    marginTop: 4,
    fontSize: 12,
  },
  managementCard: {
    marginHorizontal: tokens.spacing.gapLg * 1.5,
    marginBottom: tokens.spacing.gap,
    gap: tokens.spacing.gap,
  },
  membersCard: {
    marginHorizontal: tokens.spacing.gapLg * 1.5,
    marginBottom: tokens.spacing.gap,
    gap: tokens.spacing.gap,
  },
  sectionTitle: {
    color: '#fff',
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
  switchLabel: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteRow: {
    flexDirection: 'row',
    gap: tokens.spacing.gap,
    alignItems: 'center',
  },
  inviteInput: {
    flex: 1,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
  },
  inviteButton: {
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: 10,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#5AC4FF',
  },
  inviteButtonLabel: {
    color: '#021018',
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: tokens.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#5AC4FF',
  },
  saveButtonLabel: {
    color: '#021018',
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  memberName: {
    color: '#fff',
  },
  memberRole: {
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  empty: {
    color: 'rgba(255,255,255,0.6)',
  },
});
