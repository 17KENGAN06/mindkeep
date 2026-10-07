import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from './src/api/client';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { clearStoredToken } from './src/features/auth/session';
import { ThemeProvider, hydrateTheme } from './src/features/theme/ThemeProvider';
import { hydrateLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palettes, type ThemeMode } from './src/theme';

/** Only a dead session signs out — a 401 like INVALID_PASSWORD is a form error. */
function signOutOnUnauthorized(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 401 || error.code !== 'UNAUTHORIZED') return;
  void clearStoredToken();
  queryClient.setQueryData(['auth', 'me'], null);
}

// React Native has no window focus event: tell TanStack Query when the app is in the foreground,
// so stale displayed data refetches on return and polling pauses in the background.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

/** Client errors (4xx) will not change on retry; network, 429 and 5xx get at most two more tries. */
function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500 && error.status !== 429) return false;
  return failureCount < 2;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Fresh for 30 s: quick app/tab switches do not refetch.
      staleTime: 30_000,
      retry: shouldRetryQuery,
    },
  },
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
