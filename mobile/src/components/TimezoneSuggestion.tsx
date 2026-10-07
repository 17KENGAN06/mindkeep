import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { detectDeviceTimezone } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useTheme } from '../features/theme/useTheme';
import { useAccountToday } from '../features/time/useAccountToday';
import { zonesShareClock } from '../utils/date';
import { AppButton } from './ui';

const KEEP_KEY_PREFIX = 'mindkeep.timezoneKeep:';

function keepKey(account: string, device: string): string {
  return `${KEEP_KEY_PREFIX}${account}|${device}`;
}

/** Phone time zone, re-read whenever the app returns to the foreground (travel, manual change). */
function useDeviceTimezone(): string {
  const [device, setDevice] = useState(detectDeviceTimezone);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDevice(detectDeviceTimezone());
    });
    return () => subscription.remove();
  }, []);
  return device;
}

type TimezoneSuggestionProps = {
  /** `banner` (Today): dismissible suggestion. `settings`: account + phone lines, always offers the switch. */
  variant?: 'banner' | 'settings';
};

/**
 * The account time zone (User.timezone) is the source of truth for "today". When the phone's
 * zone keeps a different clock, suggest switching — never change it without the user's tap.
 */
export function TimezoneSuggestion({ variant = 'banner' }: TimezoneSuggestionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, updateTimezone } = useAuth();
  const { timeZone: account, today } = useAccountToday();
  const device = useDeviceTimezone();
  const [kept, setKept] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const differs = Boolean(user) && !zonesShareClock(account, device, today);

  useEffect(() => {
    if (variant !== 'banner' || !differs) return;
    let cancelled = false;
    setKept(null);
    AsyncStorage.getItem(keepKey(account, device))
      .then((value) => {
        if (!cancelled) setKept(value === '1');
      })
      .catch(() => {
        // Storage unavailable: just show the suggestion again.
        if (!cancelled) setKept(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account, device, differs, variant]);

  const useDevice = async () => {
    setError(null);
    setBusy(true);
    try {
      await updateTimezone(device);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const keepAccount = () => {
    setKept(true);
    void AsyncStorage.setItem(keepKey(account, device), '1').catch(() => undefined);
  };

  if (variant === 'settings') {
    return (
      <View style={styles.settings}>
        <Text style={[styles.zone, { color: colors.ink }]}>{t('common.timezoneCurrent', { timezone: account })}</Text>
        <Text style={[styles.zone, { color: colors.muted }]}>{t('common.timezoneDevice', { timezone: device })}</Text>
        {differs ? (
          <AppButton label={t('timezone.use')} loading={busy} onPress={() => void useDevice()} />
        ) : null}
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </View>
    );
  }

  // Render nothing until the "Keep" choice is known, so the banner never flashes.
  if (!differs || kept !== false) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.panel, borderColor: colors.brand }]}>
      <Text style={[styles.title, { color: colors.ink }]}>{t('timezone.title')}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{t('timezone.body', { device, account })}</Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <View style={styles.actions}>
        <AppButton label={t('timezone.use')} loading={busy} onPress={() => void useDevice()} />
        <AppButton label={t('timezone.keep')} variant="secondary" disabled={busy} onPress={keepAccount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 18, borderWidth: 1, gap: 8, padding: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  actions: { gap: 8, marginTop: 4 },
  settings: { gap: 8 },
  zone: { fontSize: 15 },
  error: { fontSize: 14 },
});
