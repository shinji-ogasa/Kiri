import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { fetchProfile, updateExpoPushToken, uploadAvatar, upsertProfile } from '@/features/auth/api';
import { SignInInput, SignUpInput } from '@/features/auth/validators';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';

type AuthStatus = 'idle' | 'loading' | 'ready';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  status: AuthStatus;
  initializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput & { avatar?: { uri: string; mimeType?: string } | null }) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  savePushToken: (token: string | null) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  status: 'idle',
  initializing: true,
  error: null,
  initialize: async () => {
    if (!get().initializing) return;
    set({ status: 'loading' });
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    set({ session });
    if (session?.user?.id) {
      await get().refreshProfile(session.user.id);
    }
    set({ status: 'ready', initializing: false });
  },
  refreshProfile: async (userId?: string) => {
    const uid = userId ?? get().session?.user?.id;
    if (!uid) return null;
    const profile = await fetchProfile(uid);
    set({ profile });
    return profile;
  },
  signIn: async ({ email, password }) => {
    set({ status: 'loading', error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ status: 'idle', error: error.message });
      throw error;
    }
    set({ session: data.session ?? null });
    if (data.user?.id) {
      await get().refreshProfile(data.user.id);
    }
    set({ status: 'ready' });
  },
  signUp: async ({ email, password, username, avatar }) => {
    set({ status: 'loading', error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) {
      set({ status: 'idle', error: error.message });
      throw error;
    }

    const userId = data.user?.id;
    let avatarPath: string | null = null;

    if (avatar?.uri && userId) {
      avatarPath = await uploadAvatar({ uri: avatar.uri, userId, mimeType: avatar.mimeType });
    }

    if (userId) {
      await upsertProfile({ user_id: userId, username, avatar_url: avatarPath });
      await get().refreshProfile(userId);
    }

    set({ session: data.session ?? null, status: 'ready' });
    return get().profile;
  },
  savePushToken: async (token) => {
    const profile = get().profile;
    const userId = profile?.user_id ?? get().session?.user?.id;
    if (!userId) return;
    if (profile?.expo_push_token === token) return;
    try {
      const updated = await updateExpoPushToken(userId, token);
      if (updated) {
        set({ profile: updated });
      }
    } catch (error) {
      console.warn('[push-token] update failed', (error as Error).message);
    }
  },
  signOut: async () => {
    const currentProfile = get().profile;
    if (currentProfile?.user_id) {
      try {
        await updateExpoPushToken(currentProfile.user_id, null);
      } catch (error) {
        console.warn('[push-token] clear failed', (error as Error).message);
      }
    }
    await supabase.auth.signOut();
    set({ session: null, profile: null, status: 'idle' });
  },
}));

supabase.auth.onAuthStateChange(async (_event, session) => {
  useAuthStore.setState({ session });
  if (session?.user?.id) {
    await useAuthStore.getState().refreshProfile(session.user.id);
  } else {
    useAuthStore.setState({ profile: null });
  }
});
