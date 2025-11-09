import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassCard } from '@/components/surfaces/GlassCard';
import { tokens } from '@/constants/tokens';

export default function ConnectScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed) && !/^\d{8}$/.test(trimmed)) {
      setError('6桁(グループ) もしくは 8桁(DM) の数値コードを入力してください。');
      return;
    }
    setError(null);
    // TODO: RPC 呼び出し → room/dm 画面へ遷移
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
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

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handleConnect}>
            <Text style={styles.buttonLabel}>Connect</Text>
          </Pressable>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040505',
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
  buttonLabel: {
    color: '#021018',
    fontSize: 16,
    fontWeight: '600',
  },
});
