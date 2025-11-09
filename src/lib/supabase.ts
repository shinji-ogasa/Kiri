import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { getEnv, requireEnv } from '@/utils/env';

const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL', getEnv('SUPABASE_URL'));
const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', getEnv('SUPABASE_ANON_KEY'));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
});

export type SupabaseClient = typeof supabase;
