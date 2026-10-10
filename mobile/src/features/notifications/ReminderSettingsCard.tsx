import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { TimeWheel } from '../../components/TimeWheel';
import { userHasModule } from '../../config/appModules';
import { fonts } from '../../config/fonts';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/useTheme';
import { getPermissionState, requestPermission, type PermissionState } from './localReminders';
import { phoneRemindersAvailable } from './notificationsModule';
import { updateReminderSettings, useReminderSettings } from './useLocalReminders';

/**
 * Settings block for phone reminders. Says plainly what reaches the phone (only tasks marked
 * important) and what stays in the in-app bell (reviews), then: on/off, day before / on the day,
 * and any time of day on a scroll wheel.
 */
export function ReminderSettingsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
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

  // Expo Go on Android cannot load the notifications module at all (dev-only situation).
  if (!phoneRemindersAvailable) {
    return (
      <View
        style={[styles.card, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}
      >
        <Text style={[styles.title, { color: colors.ink }]}>{t('notifications.push.toggle')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {t('notifications.push.unavailable')}
        </Text>
      </View>
    );
  }
  const enabled = settings.enabled && permission === 'granted';
  const withTasks = userHasModule(user, 'tasks');

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

  const switchColors = (on: boolean) => ({
    trackColor: { false: colors.line, true: `${colors.brand}aa` },
    thumbColor: on ? colors.brand : colors.muted,
  });

  const rule = (icon: AppIconName, title: string, text: string, tone: string) => (
    <View style={styles.rule}>
      <View style={[styles.ruleIcon, { backgroundColor: `${tone}1f` }]}>
        <AppIcon name={icon} color={tone} size={16} />
      </View>
      <View style={styles.ruleCopy}>
        <Text style={[styles.ruleTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.ruleText, { color: colors.muted }]}>{text}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.ink }]}>
            {t('notifications.push.toggle')}
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            {t('notifications.push.settingsHint')}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t('notifications.push.toggle')}
          disabled={busy}
          value={enabled}
          onValueChange={(next) => void onToggle(next)}
          {...switchColors(enabled)}
        />
      </View>

      {/* What goes where — the one thing people need to know about MindKeep notifications. */}
      <View style={[styles.rules, { backgroundColor: `${colors.bg}8c`, borderColor: colors.line }]}>
        {rule(
          'flag',
          t('notifications.push.ruleImportantTitle'),
          t('notifications.push.ruleImportantText'),
          colors.warn,
        )}
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        {rule(
          'notifications-outline',
          t('notifications.push.ruleBellTitle'),
          t('notifications.push.ruleBellText'),
          colors.brand,
        )}
      </View>

      {!withTasks ? (
        <Text style={[styles.note, { color: colors.muted }]}>
          {t('notifications.push.needTasks')}
        </Text>
      ) : null}

      {permission === 'denied' ? (
        <View
          style={[
            styles.denied,
            { borderColor: `${colors.warn}55`, backgroundColor: `${colors.warn}14` },
          ]}
        >
          <Text style={[styles.deniedText, { color: colors.ink }]}>
            {t('notifications.push.denied')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
            hitSlop={6}
          >
            <Text style={[styles.link, { color: colors.brand }]}>
              {t('notifications.push.openSettings')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {enabled ? (
        <>
          <View style={styles.block}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {t('notifications.push.when')}
            </Text>
            <View style={styles.optionRow}>
              <View style={styles.copy}>
                <Text style={[styles.optionTitle, { color: colors.ink }]}>
                  {t('notifications.push.dayBefore')}
                </Text>
                <Text style={[styles.optionHint, { color: colors.muted }]}>
                  {t('notifications.push.dayBeforeHint')}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t('notifications.push.dayBefore')}
                value={settings.dayBefore}
                onValueChange={(next) => void updateReminderSettings({ dayBefore: next })}
                {...switchColors(settings.dayBefore)}
              />
            </View>
            <View style={styles.optionRow}>
              <View style={styles.copy}>
                <Text style={[styles.optionTitle, { color: colors.ink }]}>
                  {t('notifications.push.onTheDay')}
                </Text>
                <Text style={[styles.optionHint, { color: colors.muted }]}>
                  {t('notifications.push.onTheDayHint')}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t('notifications.push.onTheDay')}
                value={settings.onTheDay}
                onValueChange={(next) => void updateReminderSettings({ onTheDay: next })}
                {...switchColors(settings.onTheDay)}
              />
            </View>
            {!settings.dayBefore && !settings.onTheDay ? (
              <Text style={[styles.note, { color: colors.warn }]}>
                {t('notifications.push.noneChosen')}
              </Text>
            ) : null}
          </View>

          {/* Label left, compact wheel right: one row instead of a big block. */}
          <View style={styles.optionRow}>
            <View style={styles.copy}>
              <Text style={[styles.optionTitle, { color: colors.ink }]}>
                {t('notifications.push.time')}
              </Text>
              <Text style={[styles.optionHint, { color: colors.muted }]}>
                {t('notifications.push.timeHint')}
              </Text>
            </View>
            <TimeWheel
              hour={settings.hour}
              minute={settings.minute}
              hourLabel={t('notifications.push.hours')}
              minuteLabel={t('notifications.push.minutes')}
              onChange={(hour, minute) => void updateReminderSettings({ hour, minute })}
            />
          </View>
        </>
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
  rules: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  rule: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  ruleIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  ruleCopy: { flex: 1, gap: 2 },
  ruleTitle: { fontFamily: fonts.bold, fontSize: 14 },
  ruleText: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
  note: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17 },
  denied: { borderRadius: 14, borderWidth: 1, gap: 6, padding: 12 },
  deniedText: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19 },
  link: { fontFamily: fonts.semibold, fontSize: 14 },
  block: { gap: 10 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  optionRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  optionTitle: { fontFamily: fonts.semibold, fontSize: 14.5 },
  optionHint: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});
