import React, { ReactNode, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { KiriThemeProvider } from '@/contexts/kiri-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { useAuthStore } from '@/store/useAuthStore';

type Props = {
  children: ReactNode;
};

/**
 * グローバルな UI プロバイダー (SafeArea + Gesture)。
 * 今後ここに Theme/Store/QueryClient などをぶら下げる。
 */
export function AppProviders({ children }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const initializeAuth = useAuthStore((state) => state.initialize);
  const session = useAuthStore((state) => state.session);
  const savePushToken = useAuthStore((state) => state.savePushToken);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const receiveListener = Notifications.addNotificationReceivedListener(() => {
      // Foreground notifications can be handled here (analytics/logging)
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {
      // Users can be navigated based on notification data here
    });
    return () => {
      receiveListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!session?.user?.id) return;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && !cancelled) {
        await savePushToken(token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, savePushToken]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KiriThemeProvider scheme={scheme}>{children}</KiriThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
