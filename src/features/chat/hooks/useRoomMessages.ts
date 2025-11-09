import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

import { fetchRoomMessages, sendTextMessage } from '@/features/chat/api';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/message';

export function useRoomMessages(roomId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRoomMessages(roomId);
        if (!cancelled) {
          setMessages(data);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((msg) => msg.id !== payload.old.id);
            }
            const next = payload.new as Message;
            const exists = prev.some((msg) => msg.id === next.id);
            if (exists) {
              return prev.map((msg) => (msg.id === next.id ? next : msg));
            }
            return [...prev, next].sort((a, b) =>
              (a.created_at ?? '').localeCompare(b.created_at ?? '')
            );
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId]);

  const postMessage = async (text: string, senderId: string) => {
    if (!roomId) throw new Error('Room not loaded');
    await sendTextMessage(roomId, senderId, text);
  };

  return {
    messages,
    loading,
    error,
    sendMessage: postMessage,
  };
}
