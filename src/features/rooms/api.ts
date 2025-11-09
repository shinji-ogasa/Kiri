import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { Room } from '@/types/room';

type GroupOptions = {
  isPublic?: boolean;
  isPersistent?: boolean;
  invitedAccountIds?: string[];
};

async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function joinOrCreateGroupRoom({
  code6,
  userId,
  options = {},
}: {
  code6: string;
  userId: string;
  options?: GroupOptions;
}): Promise<Room> {
  const userProfile = await fetchProfileByUserId(userId);
  if (!userProfile) {
    throw new Error('プロフィールを設定してください');
  }

  const { data: existingRoom, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code6', code6)
    .maybeSingle();

  if (roomErr && roomErr.code !== 'PGRST116') {
    throw roomErr;
  }

  if (existingRoom) {
    const { data: membership } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', existingRoom.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingRoom.is_public && !membership) {
      const { data: invite } = await supabase
        .from('invites')
        .select('id')
        .eq('room_id', existingRoom.id)
        .eq('invited_account_id8', userProfile.account_id8)
        .maybeSingle();

      if (!invite && existingRoom.creator !== userId) {
        throw new Error('招待されていないため参加できません');
      }
    }

    await ensureMembership(existingRoom.id, userId, membership?.role ?? (existingRoom.creator === userId ? 'admin' : 'member'));
    return existingRoom as Room;
  }

  const expiresAt =
    options.isPersistent === false || !options.isPersistent ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

  const { data: newRoom, error: createErr } = await supabase
    .from('rooms')
    .insert({
      kind: 'group',
      code6,
      creator: userId,
      is_public: options.isPublic ?? true,
      is_persistent: options.isPersistent ?? false,
      expires_at: options.isPersistent ? null : expiresAt,
    })
    .select('*')
    .single();

  if (createErr || !newRoom) {
    throw createErr;
  }

  await ensureMembership(newRoom.id, userId, 'admin');

  if (!newRoom.is_public && options.invitedAccountIds && options.invitedAccountIds.length > 0) {
    await inviteAccountsToRoom(newRoom.id, options.invitedAccountIds, userId);
  }

  return newRoom as Room;
}

async function ensureMembership(roomId: string, userId: string, role: 'admin' | 'member' = 'member') {
  const { data: membership } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    await supabase.from('room_members').insert({
      room_id: roomId,
      user_id: userId,
      role,
    });
  }
}

export async function ensureDmRoom({
  currentUserId,
  targetAccountId,
}: {
  currentUserId: string;
  targetAccountId: string;
}): Promise<{ room: Room; targetProfile: Profile }> {
  const { data: targetProfile, error: targetErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('account_id8', targetAccountId)
    .maybeSingle();

  if (targetErr || !targetProfile) {
    throw new Error('指定したアカウントIDが見つかりません');
  }

  if (targetProfile.user_id === currentUserId) {
    throw new Error('自分自身とは DM できません');
  }

  // 既存 DM 探索
  const { data: myDmRooms, error: myRoomsErr } = await supabase
    .from('room_members')
    .select('room_id, rooms!inner(kind)')
    .eq('user_id', currentUserId)
    .eq('rooms.kind', 'dm');

  if (myRoomsErr) {
    throw myRoomsErr;
  }

  const candidateRoomIds = (myDmRooms ?? []).map((item) => item.room_id);
  if (candidateRoomIds.length > 0) {
    const { data: sharedRoom } = await supabase
      .from('room_members')
      .select('room_id, rooms!inner(*)')
      .eq('user_id', targetProfile.user_id)
      .in('room_id', candidateRoomIds)
      .maybeSingle();

    if (sharedRoom?.rooms) {
      await ensureMembership(sharedRoom.room_id, currentUserId);
      return { room: sharedRoom.rooms as Room, targetProfile: targetProfile as Profile };
    }
  }

  // 新規 DM 作成
  const { data: dmRoom, error: createDmErr } = await supabase
    .from('rooms')
    .insert({
      kind: 'dm',
      creator: currentUserId,
      is_public: false,
    })
    .select('*')
    .single();

  if (createDmErr || !dmRoom) {
    throw createDmErr;
  }

  await supabase.from('room_members').insert([
    { room_id: dmRoom.id, user_id: currentUserId, role: 'admin' },
    { room_id: dmRoom.id, user_id: targetProfile.user_id, role: 'admin' },
  ]);

  return { room: dmRoom as Room, targetProfile: targetProfile as Profile };
}

export async function fetchUserRooms(userId: string) {
  const { data, error } = await supabase
    .from('room_members')
    .select(
      `
      role,
      room_id,
      rooms!inner(
        id,
        kind,
        code6,
        is_public,
        is_persistent,
        created_at
      )
    `
    )
    .eq('user_id', userId)
    .order('rooms.created_at', { ascending: false });

  if (error) {
    throw error;
  }

  type RoomMemberRow = {
    role: 'admin' | 'member';
    rooms: Room;
  };

  return ((data ?? []) as RoomMemberRow[]).map((entry) => ({
    role: entry.role,
    room: entry.rooms,
  }));
}

export async function fetchRoomInfo(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    throw error;
  }

  return data as Room;
}

export async function fetchRoomMembers(roomId: string) {
  const { data, error } = await supabase
    .from('room_members')
    .select(
      `
      room_id,
      user_id,
      role,
      profiles:user_id (
        account_id8,
        username,
        avatar_url
      )
    `
    )
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateRoomSettings(roomId: string, payload: { is_public?: boolean; is_persistent?: boolean }) {
  let latest: Room | null = null;

  if (payload.is_public !== undefined) {
    const { data, error } = await supabase.rpc('set_room_visibility', {
      p_room_id: roomId,
      p_is_public: payload.is_public,
    });
    if (error) {
      throw error;
    }
    latest = data as Room;
  }

  if (payload.is_persistent !== undefined) {
    const { data, error } = await supabase.rpc('set_room_persistence', {
      p_room_id: roomId,
      p_is_persistent: payload.is_persistent,
    });
    if (error) {
      throw error;
    }
    latest = data as Room;
  }

  if (!latest) {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error) {
      throw error;
    }
    latest = data as Room;
  }

  return latest;
}

export async function inviteAccountsToRoom(roomId: string, accountIds: string[], invitedBy: string) {
  if (accountIds.length === 0) return;
  const values = accountIds.map((id) => ({
    room_id: roomId,
    invited_account_id8: id,
    invited_by: invitedBy,
  }));
  await supabase.from('invites').upsert(values, { onConflict: 'room_id,invited_account_id8' });
}

export async function addMemberByAccountId(roomId: string, accountId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('account_id8', accountId)
    .maybeSingle();

  if (!profile) {
    throw new Error('該当するアカウントIDが見つかりません');
  }

  await ensureMembership(roomId, profile.user_id, 'member');
}
