import { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

const TYPING_TIMEOUT_MS = 4000;

export function useTypingIndicator(roomId?: string, userId?: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingRef = useRef<Record<string, number>>({});

  const cleanupTyping = useCallback(() => {
    const now = Date.now();
    const entries = Object.entries(typingRef.current).filter(
      ([, timestamp]) => now - timestamp < TYPING_TIMEOUT_MS,
    );
    typingRef.current = Object.fromEntries(entries);
    setTypingUsers(entries.map(([key]) => key));
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;
    const channel = supabase.channel(`typing:${roomId}`, {
      config: {
        broadcast: { ack: false },
      },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload?.userId || payload.userId === userId) return;
      if (payload.typing) {
        typingRef.current = { ...typingRef.current, [payload.userId]: Date.now() };
      } else {
        const next = { ...typingRef.current };
        delete next[payload.userId];
        typingRef.current = next;
      }
      cleanupTyping();
    });

    channel.subscribe();
    const interval = setInterval(cleanupTyping, 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      channelRef.current = null;
      typingRef.current = {};
      setTypingUsers([]);
    };
  }, [roomId, userId, cleanupTyping]);

  const setTypingState = useCallback(
    (typing: boolean) => {
      if (!channelRef.current || !userId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, typing },
      });
      if (!typing) {
        const next = { ...typingRef.current };
        delete next[userId];
        typingRef.current = next;
        cleanupTyping();
      } else {
        typingRef.current = { ...typingRef.current, [userId]: Date.now() };
      }
    },
    [userId, cleanupTyping],
  );

  const otherTypingUsers = typingUsers.filter((id) => id !== userId);

  return {
    typingUsers: otherTypingUsers,
    setTypingState,
  };
}
