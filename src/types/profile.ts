export type Profile = {
  user_id: string;
  account_id8: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  expo_push_token?: string | null;
  created_at?: string;
};

export type ProfileUpsertInput = {
  user_id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  expo_push_token?: string | null;
};
