import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useTheme } from '../features/theme/useTheme';
import { AppButton } from './ui';

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function useQueryErrorMessage(error: unknown, notFoundText?: string): string {
  const { t } = useTranslation();
  if (isNotFoundError(error)) return notFoundText ?? t('common.notFound');
  // Offline / timeout → network text, 5xx → server text, others → their own message.
  return mapAuthError(error, t);
}

type QueryErrorViewProps = {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  notFoundText?: string;
};

/** Nothing to show yet and the load failed: message plus Retry (a real 404 needs no Retry). */
export function QueryErrorView({ error, onRetry, retrying = false, notFoundText }: QueryErrorViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const notFound = isNotFoundError(error);
  const message = useQueryErrorMessage(error, notFoundText);

  return (
    <View style={[styles.centered, { backgroundColor: colors.bg }]}>
      <Text style={[styles.message, { color: notFound ? colors.ink : colors.danger }]}>{message}</Text>
      {notFound ? null : (
        <View style={styles.action}>
          <AppButton label={t('common.retry')} loading={retrying} onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

/** Data is already on screen and a refresh failed: keep the data, show one line. */
export function InlineQueryError({ error, notFoundText }: { error: unknown; notFoundText?: string }) {
  const { colors } = useTheme();
  const message = useQueryErrorMessage(error, notFoundText);
  return <Text style={[styles.inline, { color: colors.danger }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  message: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  action: { alignSelf: 'stretch' },
  inline: { fontSize: 14, lineHeight: 20 },
});
