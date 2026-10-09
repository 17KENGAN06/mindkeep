import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';
import { getPermissionState, requestPermission, type PermissionState } from './localReminders';
import { updateReminderSettings, useReminderSettings } from './useLocalReminders';

const HOURS = [7, 8, 9, 10, 12, 18, 20, 21];

const pad = (value: number) => String(value).padStart(2, '0');

/** Settings block: phone reminders on/off and the daily time. */
export function ReminderSettingsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const settings = useReminderSettings();
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [busy, setBusy] = useState(false);

  // Re-check when coming back from the system settings.
  useEffect(() => {
    const check = () => void getPermissionState().then(setPermission);
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  if (!settings) return null;
  const enabled = settings.enabled && permission === 'granted';

  const onToggle = async (next: boolean) => {
    setBusy(true);
    try {
      if (!next) {
        await updateReminderSettings({ enabled: false, asked: true });
        return;
      }
      const state = await requestPermission(t('notifications.push.channel'));
      setPermission(state);
      await updateReminderSettings({ enabled: state === 'granted', asked: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('notifications.push.toggle')}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{t('notifications.push.settingsHint')}</Text>
        </View>
        <Switch
          accessibilityLabel={t('notifications.push.toggle')}
          disabled={busy}
          value={enabled}
          onValueChange={(next) => void onToggle(next)}
          trackColor={{ false: colors.line, true: `${colors.brand}aa` }}
          thumbColor={enabled ? colors.brand : colors.muted}
        />
      </View>

      {permission === 'denied' ? (
        <View style={[styles.denied, { borderColor: `${colors.warn}55`, backgroundColor: `${colors.warn}14` }]}>
          <Text style={[styles.deniedText, { color: colors.ink }]}>{t('notifications.push.denied')}</Text>
          <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} hitSlop={6}>
            <Text style={[styles.link, { color: colors.brand }]}>{t('notifications.push.openSettings')}</Text>
          </Pressable>
        </View>
      ) : null}

      {enabled ? (
        <View style={styles.timeBlock}>
          <Text style={[styles.label, { color: colors.muted }]}>{t('notifications.push.time')}</Text>
          <View style={styles.hours}>
            {HOURS.map((hour) => {
              const active = settings.hour === hour && settings.minute === 0;
              return (
                <Pressable
                  key={hour}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => void updateReminderSettings({ hour, minute: 0 })}
                  style={[
                    styles.hour,
                    { borderColor: active ? colors.brand : colors.line, backgroundColor: active ? `${colors.brand}22` : 'transparent' },
                  ]}
                >
                  <Text style={[styles.hourText, { color: active ? colors.brand : colors.ink }, active && styles.hourActive]}>
                    {pad(hour)}:00
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, gap: 14, marginBottom: 10, padding: 16 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  copy: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 4 },
  denied: { borderRadius: 14, borderWidth: 1, gap: 6, padding: 12 },
  deniedText: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19 },
  link: { fontFamily: fonts.semibold, fontSize: 14 },
  timeBlock: { gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: { borderRadius: 12, borderWidth: 1, minWidth: 68, paddingHorizontal: 12, paddingVertical: 9 },
  hourText: { fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  hourActive: { fontFamily: fonts.bold },
});
