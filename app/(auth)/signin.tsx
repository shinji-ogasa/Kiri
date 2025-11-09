import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { signInSchema } from '@/features/auth/validators';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const status = useAuthStore((state) => state.status);
  const storeError = useAuthStore((state) => state.error);
  const loading = status === 'loading';

  const handleSignIn = async () => {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(result.error.errors[0]?.message ?? '入力内容を確認してください');
      return;
    }
    setLocalError(null);
    try {
      await signIn(result.data);
      router.replace('/messages');
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.card}>
            <Text style={styles.title}>ログイン</Text>
          <Text style={styles.subtitle}>Kiri へようこそ。登録済みのメールとパスワードを入力してください。</Text>

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
              placeholder="••••••••"
              style={styles.input}
            />
          </View>

          {(localError || storeError) && (
            <Text style={styles.error}>{localError ?? storeError}</Text>
          )}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.buttonLabel}>{loading ? '送信中...' : 'サインイン'}</Text>
          </Pressable>

          <View style={styles.inline}>
            <Text style={styles.inlineText}>アカウントをお持ちでないですか？</Text>
            <Link href="/(auth)/signup" style={styles.link}>
              新規登録
            </Link>
          </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
