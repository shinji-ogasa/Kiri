import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '@/lib/supabase';
import { Profile, ProfileUpsertInput } from '@/types/profile';

const AVATAR_BUCKET = 'avatars';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profiles] fetch error', error.message);
    return null;
  }

  return data as Profile | null;
}

export async function upsertProfile(payload: ProfileUpsertInput): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

type UploadAvatarInput = {
  uri: string;
  userId: string;
  mimeType?: string;
};

export async function uploadAvatar({ uri, userId, mimeType }: UploadAvatarInput) {
  const extension = mimeType?.split('/')[1] ?? 'jpg';
  const path = `${userId}/${uuidv4()}.${extension}`;
  const file = await FileSystem.readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  const arrayBuffer = decode(file);

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType ?? 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data?.path ?? path;
}

export async function updateExpoPushToken(userId: string, token: string | null) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}
