import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { detectDeviceTimezone } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useTheme } from '../features/theme/useTheme';
import { useAccountToday } from '../features/time/useAccountToday';
import { zonesShareClock } from '../utils/date';
import { AppButton } from './ui';
import { fonts } from '../config/fonts';

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
  /** `banner` (Today): popup over the screen. `settings`: account + phone lines, always offers the switch. */
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
  // Closed with the backdrop or Back: hidden until the app is opened again, nothing saved.
  const [later, setLater] = useState(false);
  const insets = useSafeAreaInsets();

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

  // Render nothing until the "Keep" choice is known, so the popup never flashes.
  if (!differs || kept !== false) return null;

  return (
    <Modal transparent visible={!later} animationType="fade" statusBarTranslucent onRequestClose={() => setLater(true)}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={StyleSheet.absoluteFill}
          onPress={() => setLater(true)}
        />
        <View
          style={[
            styles.popup,
            { backgroundColor: colors.panel, borderColor: colors.line, marginBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Text style={[styles.title, { color: colors.ink }]}>{t('timezone.title')}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{t('timezone.body', { device, account })}</Text>
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <AppButton label={t('timezone.use')} loading={busy} onPress={() => void useDevice()} />
            <AppButton label={t('timezone.keep')} variant="secondary" disabled={busy} onPress={keepAccount} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.55)', flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16 },
  popup: { borderRadius: 16, borderWidth: 1, gap: 10, padding: 18 },
  title: { fontSize: 18, fontFamily: fonts.bold },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  actions: { gap: 8, marginTop: 4 },
  settings: { gap: 8 },
  zone: { fontFamily: fonts.regular, fontSize: 15 },
  error: { fontFamily: fonts.regular, fontSize: 14 },
});
