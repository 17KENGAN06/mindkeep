import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from './src/api/client';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { clearStoredToken } from './src/features/auth/session';
import { ThemeProvider, hydrateTheme } from './src/features/theme/ThemeProvider';
import { hydrateLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palettes, type ThemeMode } from './src/theme';

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
  const [theme, setTheme] = useState<ThemeMode | null>(null);

  useEffect(() => {
    void Promise.all([hydrateLanguage(), hydrateTheme()]).then(([, nextTheme]) => {
      setTheme(nextTheme);
    });
  }, []);

  if (!theme) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palettes.dark.brand} size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider initialTheme={theme}>
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    backgroundColor: palettes.dark.bg,
    flex: 1,
    justifyContent: 'center',
  },
});
