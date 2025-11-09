import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/tokens';

type Props = {
  onSend: (text: string) => Promise<void> | void;
  onSendAttachment?: (file: {
    uri: string;
    mimeType?: string;
    type: 'image' | 'file';
    name?: string | null;
  }) => Promise<void> | void;
  onTypingStateChange?: (typing: boolean) => void;
  disabled?: boolean;
};

export function MessageComposer({
  onSend,
  onSendAttachment,
  onTypingStateChange,
  disabled,
}: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const typingRef = useRef(false);

  const emitTyping = (value: boolean) => {
    if (onTypingStateChange && value !== typingRef.current) {
      typingRef.current = value;
      onTypingStateChange(value);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await onSend(text.trim());
      setText('');
      emitTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    emitTyping(value.trim().length > 0);
  };

  const pickImage = async () => {
    if (!onSendAttachment || attachmentLoading || disabled) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAttachmentLoading(true);
    try {
      await onSendAttachment({
        type: 'image',
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'image',
      });
    } finally {
      setAttachmentLoading(false);
    }
  };

  const pickFile = async () => {
    if (!onSendAttachment || attachmentLoading || disabled) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setAttachmentLoading(true);
    try {
      await onSendAttachment({
        type: 'file',
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        name: asset.name,
      });
    } finally {
      setAttachmentLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingRef.current) {
        emitTyping(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={80}>
      <View style={styles.container}>
        <View style={styles.attachGroup}>
          <Pressable
            style={[styles.attachButton, (disabled || attachmentLoading) && styles.buttonDisabled]}
            onPress={pickImage}
            disabled={disabled || attachmentLoading}>
            <Text style={styles.attachLabel}>画像</Text>
          </Pressable>
          <Pressable
            style={[styles.attachButton, (disabled || attachmentLoading) && styles.buttonDisabled]}
            onPress={pickFile}
            disabled={disabled || attachmentLoading}>
            <Text style={styles.attachLabel}>ファイル</Text>
          </Pressable>
        </View>
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder="メッセージを入力"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={styles.input}
          editable={!disabled && !loading}
          multiline
        />
        <Pressable
          style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={disabled || loading}>
          <Text style={styles.buttonLabel}>{loading ? '送信中' : '送信'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: tokens.spacing.gap,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  attachGroup: {
    flexDirection: 'column',
    gap: 6,
    marginRight: tokens.spacing.gap,
  },
  attachButton: {
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  attachLabel: {
    color: '#fff',
    fontSize: 13,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: tokens.spacing.gap,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    marginRight: tokens.spacing.gap,
  },
  button: {
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: tokens.spacing.gap,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#5AC4FF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#021018',
    fontWeight: '600',
  },
});
