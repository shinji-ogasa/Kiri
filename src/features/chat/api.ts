import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { Message } from '@/types/message';

export async function fetchRoomMessages(roomId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Message[];
}

export async function sendTextMessage(roomId: string, senderId: string, text: string) {
  if (!text.trim()) {
    throw new Error('メッセージを入力してください');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender: senderId,
      type: 'text',
      text,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

const ATTACHMENTS_BUCKET = 'attachments';

type AttachmentPayload = {
  uri: string;
  mimeType?: string;
  name?: string | null;
  type: 'image' | 'file';
};

async function uploadAttachment({ uri, mimeType }: { uri: string; mimeType?: string }) {
  const extension =
    mimeType?.split('/')[1] ??
    uri.split('.').pop() ??
    'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const fileString = await FileSystem.readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  const buffer = decode(fileString);

  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType ?? 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data?.path ?? path;
}

export async function sendAttachmentMessage(
  roomId: string,
  senderId: string,
  attachment: AttachmentPayload,
) {
  const filePath = await uploadAttachment({ uri: attachment.uri, mimeType: attachment.mimeType });
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender: senderId,
      type: attachment.type === 'image' ? 'image' : 'file',
      file_url: filePath,
      meta: { name: attachment.name, mimeType: attachment.mimeType },
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

export async function fetchLastMessage(roomId: string) {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Message) ?? null;
}

export async function fetchReadState(roomId: string, userId: string) {
  const { data } = await supabase
    .from('read_states')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  return data;
}

export async function markRoomRead(roomId: string, userId: string) {
  await supabase
    .from('read_states')
    .upsert(
      {
        room_id: roomId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,user_id' },
    );
}
