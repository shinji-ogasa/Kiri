export type MessageType = 'text' | 'image' | 'file' | 'system';

export type Message = {
  id: string;
  room_id: string;
  sender: string;
  type: MessageType;
  text?: string | null;
  file_url?: string | null;
  meta?: Record<string, any> | null;
  created_at?: string;
  edited_at?: string | null;
  deleted_at?: string | null;
};
