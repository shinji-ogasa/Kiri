import { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { fetchLastMessage, fetchReadState } from '@/features/chat/api';
import { fetchUserRooms } from '@/features/rooms/api';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/message';
import { Room } from '@/types/room';

export type RoomListItem = {
  room: Room;
  role: 'admin' | 'member';
  lastMessage?: Message | null;
  hasUnread: boolean;
};

type RoomsState = {
  currentUserId: string | null;
  rooms: RoomListItem[];
  loading: boolean;
  error: string | null;
  subscribe: (userId: string) => Promise<void>;
  unsubscribe: () => void;
  markReadLocal: (roomId: string) => void;
};

let roomChannel: RealtimeChannel | null = null;
let messageChannel: RealtimeChannel | null = null;

async function buildRooms(userId: string): Promise<RoomListItem[]> {
  const entries = await fetchUserRooms(userId);
  const result: RoomListItem[] = [];
  for (const entry of entries) {
    const lastMessage = await fetchLastMessage(entry.room.id);
    const readState = await fetchReadState(entry.room.id, userId);
    const lastReadAt = readState?.last_read_at ?? null;
    const hasUnread =
      !!lastMessage &&
      (!lastReadAt || (lastMessage.created_at ?? '') > lastReadAt);
    result.push({
      room: entry.room,
      role: entry.role,
      lastMessage,
      hasUnread,
    });
  }
  return result;
}

function cleanupChannels() {
  if (roomChannel) {
    supabase.removeChannel(roomChannel);
    roomChannel = null;
  }
  if (messageChannel) {
    supabase.removeChannel(messageChannel);
    messageChannel = null;
  }
}

export const useRoomsStore = create<RoomsState>((set, get) => ({
  currentUserId: null,
  rooms: [],
  loading: false,
  error: null,
  subscribe: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: null, currentUserId: userId });
    try {
      const payload = await buildRooms(userId);
      set({ rooms: payload, loading: false });

      cleanupChannels();

      roomChannel = supabase
        .channel(`room-members-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${userId}` },
          async () => {
            const updated = await buildRooms(userId);
            set({ rooms: updated });
          },
        )
        .subscribe();

      messageChannel = supabase
        .channel(`room-messages-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            const roomId = (payload.new as Message).room_id;
            if (!roomId) return;
            set((state) => {
              const rooms = state.rooms.slice();
              const index = rooms.findIndex((item) => item.room.id === roomId);
              if (index === -1) {
                return state;
              }
              const message = payload.new as Message;
              const hasUnread = message.sender !== state.currentUserId;
              rooms[index] = {
                ...rooms[index],
                lastMessage: message,
                hasUnread: hasUnread || rooms[index].hasUnread,
              };
              return { ...state, rooms };
            });
          },
        )
        .subscribe();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  unsubscribe: () => {
    cleanupChannels();
    set({ rooms: [], currentUserId: null });
  },
  markReadLocal: (roomId: string) => {
    set((state) => ({
      ...state,
      rooms: state.rooms.map((item) =>
        item.room.id === roomId ? { ...item, hasUnread: false } : item,
      ),
    }));
  },
}));
