import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/constants/tokens';

type Props = {
  text?: string | null;
  isOwn: boolean;
  timestamp?: string;
};

function MessageBubbleComponent({ text, isOwn, timestamp }: Props) {
  return (
    <View style={[styles.container, isOwn ? styles.self : styles.other]}>
      <View style={[styles.bubble, isOwn ? styles.selfBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.selfText : styles.otherText]}>{text}</Text>
        {timestamp && (
          <Text style={[styles.time, isOwn ? styles.selfTime : styles.otherTime]}>
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  self: {
    justifyContent: 'flex-end',
  },
  other: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: tokens.spacing.inset,
    paddingVertical: tokens.spacing.gap,
    borderRadius: tokens.radius.md,
  },
  selfBubble: {
    backgroundColor: '#5AC4FF',
  },
  otherBubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  text: {
    fontSize: 15,
  },
  selfText: {
    color: '#021018',
  },
  otherText: {
    color: '#fff',
  },
  time: {
    marginTop: 4,
    fontSize: 11,
  },
  selfTime: {
    color: 'rgba(2,16,24,0.7)',
  },
  otherTime: {
    color: 'rgba(255,255,255,0.65)',
  },
});

export const MessageBubble = memo(MessageBubbleComponent);
