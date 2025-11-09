import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    try {
      // TODO: Supabase Auth サインアップ + profiles 作成
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
            <Pressable style={styles.secondaryButton} onPress={pickAvatar}>
              <Text style={styles.secondaryLabel}>{avatar ? '変更する' : 'アイコンを選択'}</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  container: {
    flex: 1,
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
    flex: 1,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.02)',
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
});
