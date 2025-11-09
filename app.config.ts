import { ConfigContext, ExpoConfig } from 'expo/config';
import 'dotenv/config';

const APP_NAME = 'Kiri';
const APP_SLUG = 'kiri';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';

  return {
    ...config,
    name: APP_NAME,
    slug: APP_SLUG,
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'kiri',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/images/icon.png',
    updates: {
      fallbackToCacheTimeout: 0,
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#FFFFFF',
          sounds: [],
        },
      ],
    ],
    extra: {
      appEnv,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      turnUrl: process.env.EXPO_PUBLIC_TURN_URL ?? '',
      turnUsername: process.env.EXPO_PUBLIC_TURN_USERNAME ?? '',
      turnCredential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL ?? '',
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? '',
      },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
