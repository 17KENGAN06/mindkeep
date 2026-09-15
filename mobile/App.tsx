import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from './src/api/client';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { clearStoredToken } from './src/features/auth/session';
import { hydrateLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

function signOutOnUnauthorized(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  void clearStoredToken();
  queryClient.setQueryData(['auth', 'me'], null);
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: Error) => {
      signOutOnUnauthorized(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: Error) => {
      signOutOnUnauthorized(error);
    },
  }),
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrateLanguage().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
});
