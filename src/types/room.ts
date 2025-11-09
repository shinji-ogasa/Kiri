export type RoomKind = 'group' | 'dm';

export type Room = {
  id: string;
  kind: RoomKind;
  code6?: string | null;
  creator: string;
  is_public?: boolean;
  is_persistent?: boolean;
  expires_at?: string | null;
  created_at?: string;
};

export type RoomMember = {
  room_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at?: string;
};
