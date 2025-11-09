import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';
import { signUpSchema } from '@/features/auth/validators';
import { useAuthStore } from '@/store/useAuthStore';

type AvatarAsset = {
  uri: string;
  size?: number;
  mimeType?: string;
};

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<AvatarAsset | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successAccountId, setSuccessAccountId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const status = useAuthStore((state) => state.status);
  const storeError = useAuthStore((state) => state.error);
  const loading = status === 'loading';

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 1,
      quality: 0.9,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAvatar({
        uri: asset.uri,
        size: asset.fileSize,
        mimeType: asset.mimeType,
      });
    }
  };

  const handleSignUp = async () => {
    const result = signUpSchema.safeParse({ email, password, username });
    if (!result.success) {
      setLocalError(result.error.errors[0]?.message ?? '入力内容を確認してください');
      return;
    }
    setLocalError(null);
    try {
      const profile = await signUp({
        ...result.data,
        avatar,
      });
      setSuccessAccountId(profile?.account_id8 ?? null);
      setModalVisible(true);
      setCopied(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setAvatar(null);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
        keyboardVerticalOffset={insets.top + 24}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <GlassCard style={styles.card}>
            <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.subtitle}>
            ユーザーネーム・メール・パスワードを登録し、オプションでアイコンを設定します。
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ユーザーネーム</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              placeholder="kiri_user"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="最低 8 文字"
              style={styles.input}
            />
          </View>

          <View style={styles.avatarRow}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} />
            ) : (
              <View style={[styles.avatarPreview, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>Icon</Text>
              </View>
            )}
            <Pressable
              style={[styles.secondaryButton, styles.avatarButton]}
              onPress={pickAvatar}>
              <Text style={styles.secondaryLabel}>{avatar ? '変更する' : 'アイコンを選択'}</Text>
            </Pressable>
          </View>

          {(localError || storeError) && (
            <Text style={styles.error}>{localError ?? storeError}</Text>
          )}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}>
            <Text style={styles.buttonLabel}>{loading ? '登録中...' : 'アカウント作成'}</Text>
          </Pressable>

          <View style={styles.inline}>
            <Text style={styles.inlineText}>既にアカウント済み？</Text>
            <Link href="/(auth)/signin" style={styles.link}>
              ログイン
            </Link>
          </View>
        </GlassCard>

      </ScrollView>
    </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard} surfaceLevel={2}>
            <Text style={styles.modalTitle}>登録が完了しました</Text>
            <Text style={styles.modalSubtitle}>あなたのアカウントID (8桁) を控えてください。</Text>
            <Text style={styles.accountId}>{successAccountId}</Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={async () => {
                if (!successAccountId) return;
                await Clipboard.setStringAsync(successAccountId);
                setCopied(true);
              }}>
              <Text style={styles.secondaryLabel}>{copied ? 'コピー済み' : 'コピーする'}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.modalButton]}
              onPress={() => {
                setModalVisible(false);
                router.replace('/connect');
              }}>
              <Text style={styles.buttonLabel}>Connect へ進む</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: tokens.spacing.gapLg * 2,
    justifyContent: 'center',
  },
  card: {
    gap: tokens.spacing.gapLg,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.gap,
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: tokens.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarPlaceholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  secondaryButton: {
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  avatarButton: {
    flex: 1,
  },
  secondaryLabel: {
    color: '#fff',
    fontWeight: '500',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 13,
  },
  button: {
    marginTop: tokens.spacing.gapLg,
    paddingVertical: 16,
    borderRadius: tokens.radius.md,
    backgroundColor: '#5AC4FF',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#021018',
    fontSize: 16,
    fontWeight: '600',
  },
  inline: {
    marginTop: tokens.spacing.gap,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  inlineText: {
    color: 'rgba(255,255,255,0.7)',
  },
  link: {
    color: '#5AC4FF',
    fontWeight: '600',
  },
  accountId: {
    color: '#fff',
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: tokens.spacing.gapLg * 2,
  },
  modalCard: {
    gap: tokens.spacing.gap,
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
  },
});
