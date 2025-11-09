export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL?: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
      EXPO_PUBLIC_TURN_URL?: string;
      EXPO_PUBLIC_TURN_USERNAME?: string;
      EXPO_PUBLIC_TURN_CREDENTIAL?: string;
      EXPO_PUBLIC_APP_ENV?: string;
      EXPO_PUBLIC_PROJECT_ID?: string;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    }
  }
}
