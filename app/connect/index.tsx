import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';
import { ensureDmRoom, joinOrCreateGroupRoom } from '@/features/rooms/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function ConnectScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isPersistent, setIsPersistent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const initializing = useAuthStore((state) => state.initializing);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = profile?.user_id ?? session?.user?.id;

  useEffect(() => {
    if (!initializing && !session) {
      router.replace('/(auth)/signin');
    }
  }, [initializing, session, router]);

  const handleConnect = async () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed) && !/^\d{8}$/.test(trimmed)) {
      setError('6桁(グループ) もしくは 8桁(DM) の数値コードを入力してください。');
      return;
    }
    if (!userId) {
      setError('ログイン情報を取得できませんでした。');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (/^\d{6}$/.test(trimmed)) {
        const room = await joinOrCreateGroupRoom({
          code6: trimmed,
          userId,
          options: {
            isPublic,
            isPersistent,
            invitedAccountIds: !isPublic
              ? inviteInput
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v) => /^\d{8}$/.test(v))
              : [],
          },
        });
        router.push(`/room/${room.id}`);
      } else if (/^\d{8}$/.test(trimmed)) {
        const { room } = await ensureDmRoom({
          currentUserId: userId,
          targetAccountId: trimmed,
        });
        router.push(`/dm/${room.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isGroupInput = /^\d{6}$/.test(code);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
        keyboardVerticalOffset={insets.top + 24}>
        <View style={styles.container}>
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Connect</Text>
            <Text style={styles.subtitle}>
              6桁コードでグループを作成/参加、8桁アカウント ID で DM を開始します。
            </Text>

            <TextInput
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/[^0-9]/g, ''));
                setError(null);
              }}
              placeholder="123456 or 12345678"
              keyboardType="number-pad"
              maxLength={8}
              style={styles.input}
            />

            {isGroupInput && (
              <View style={styles.switchGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>公開グループにする</Text>
                  <Switch
                    value={isPublic}
                    onValueChange={(value) => {
                      setIsPublic(value);
                      if (value) {
                        setInviteInput('');
                      }
                    }}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>永続化 (24h削除なし)</Text>
                  <Switch value={isPersistent} onValueChange={setIsPersistent} />
                </View>
                {!isPublic && (
                  <View style={styles.inviteBox}>
                    <Text style={styles.inviteLabel}>招待する 8桁ID (カンマ区切り)</Text>
                    <TextInput
                      value={inviteInput}
                      onChangeText={setInviteInput}
                      placeholder="12345678, 87654321"
                      style={styles.inviteInput}
                      keyboardType="number-pad"
                      maxLength={64}
                    />
                  </View>
                )}
              </View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={loading}>
              <Text style={styles.buttonLabel}>{loading ? '処理中...' : 'Connect'}</Text>
            </Pressable>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040505',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing.gapLg * 2,
  },
  card: {
    gap: tokens.spacing.gapLg,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  input: {
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.insetLg,
    paddingVertical: 18,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  switchGroup: {
    gap: tokens.spacing.gap,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#fff',
  },
  inviteBox: {
    marginTop: tokens.spacing.gap,
    gap: 6,
  },
  inviteLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  inviteInput: {
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  button: {
    marginTop: tokens.spacing.gap,
    borderRadius: tokens.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#5AC4FF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#021018',
    fontSize: 16,
    fontWeight: '600',
  },
});
