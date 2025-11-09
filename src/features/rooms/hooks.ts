import { useEffect, useState } from 'react';

import { fetchUserRooms } from '@/features/rooms/api';
import { Room } from '@/types/room';

export type RoomWithRole = {
  room: Room;
  role: 'admin' | 'member';
};

export function useUserRooms(userId?: string) {
  const [rooms, setRooms] = useState<RoomWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserRooms(userId);
        if (mounted) {
          setRooms(data as RoomWithRole[]);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const reload = async () => {
    if (!userId) return;
    try {
      const data = await fetchUserRooms(userId);
      setRooms(data as RoomWithRole[]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { rooms, loading, error, reload };
}
