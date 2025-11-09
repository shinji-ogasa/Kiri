import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/store/useAuthStore';

export default function Index() {
  const initializing = useAuthStore((state) => state.initializing);
  const session = useAuthStore((state) => state.session);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#5AC4FF" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/messages" />;
  }

  return <Redirect href="/(auth)/signin" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#02050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
