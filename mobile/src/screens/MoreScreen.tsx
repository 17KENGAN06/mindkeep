import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { detectDeviceTimezone, timezoneChoices } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';
import type { MoreStackParamList } from '../navigation/types';
import { colors } from '../theme';

const SITE_URLS = {
  privacy: 'https://mindkeep.cloud/privacy',
  guide: 'https://mindkeep.cloud/guide',
  contact: 'https://mindkeep.cloud/contact',
} as const;

export function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout, updateTimezone } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2);
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const [timezoneBusy, setTimezoneBusy] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const deviceTimezone = useMemo(() => detectDeviceTimezone(), []);
  const zones = useMemo(() => timezoneChoices(user?.timezone), [user?.timezone]);

  const onTimezone = async (timezone: string) => {
    if (!user || timezone === user.timezone || timezoneBusy) return;
    setTimezoneError(null);
    setTimezoneBusy(true);
    try {
      await updateTimezone(timezone);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        setTimezoneError(t('auth.errors.timezone'));
      } else {
        setTimezoneError(mapAuthError(error, t));
      }
    } finally {
      setTimezoneBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('tabs.more')}</Text>
        {user ? <Text style={styles.meta}>{user.name}</Text> : null}
        {user ? <Text style={styles.muted}>{user.email}</Text> : null}

        <Pressable onPress={() => navigation.navigate('Notes')} style={styles.menuItem}>
          <Text style={styles.menuTitle}>{t('notes.title')}</Text>
          <Text style={styles.menuHint}>{t('notes.menuHint')}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.menuItemTight}>
          <View style={styles.menuHead}>
            <Text style={styles.menuTitle}>{t('notifications.title')}</Text>
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.menuHint}>{t('notifications.menuHint')}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Finance')} style={styles.menuItemTight}>
          <Text style={styles.menuTitle}>{t('finance.title')}</Text>
          <Text style={styles.menuHint}>{t('finance.menuHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => void Linking.openURL(SITE_URLS.guide)}
          style={styles.menuItemTight}
        >
          <Text style={styles.menuTitle}>{t('common.guide')}</Text>
          <Text style={styles.menuHint}>{t('common.safariHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => void Linking.openURL(SITE_URLS.contact)}
          style={styles.menuItemTight}
        >
          <Text style={styles.menuTitle}>{t('common.contact')}</Text>
          <Text style={styles.menuHint}>{t('common.safariHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => void Linking.openURL(SITE_URLS.privacy)}
          style={styles.menuItemTight}
        >
          <Text style={styles.menuTitle}>{t('common.privacy')}</Text>
          <Text style={styles.menuHint}>{t('common.safariHint')}</Text>
        </Pressable>

        <Text style={styles.section}>{t('common.timezone')}</Text>
        <Text style={styles.sectionHint}>{t('common.timezoneHint')}</Text>
        {user ? (
          <Text style={styles.currentZone}>
            {t('common.timezoneCurrent', { timezone: user.timezone })}
          </Text>
        ) : null}
        <View style={styles.row}>
          {zones.map((zone) => {
            const active = user?.timezone === zone;
            return (
              <Pressable
                key={zone}
                disabled={timezoneBusy}
                onPress={() => void onTimezone(zone)}
                style={[styles.chip, active && styles.chipActive, timezoneBusy && styles.chipBusy]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {zone === deviceTimezone ? t('common.timezoneDevice', { timezone: zone }) : zone}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {timezoneError ? <Text style={styles.error}>{timezoneError}</Text> : null}

        <Text style={styles.section}>{t('common.language')}</Text>
        <View style={styles.row}>
          {supportedLanguages.map((language) => {
            const active = current === language.code;
            return (
              <Pressable
                key={language.code}
                onPress={() => void setAppLanguage(language.code as AppLanguage)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{language.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => void logout()} style={styles.logout}>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  meta: { color: colors.ink, fontSize: 16, marginTop: 16 },
  muted: { color: colors.muted, fontSize: 14, marginTop: 4 },
  menuItem: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 28,
    padding: 16,
  },
  menuItemTight: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  menuHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  menuTitle: { color: colors.ink, flex: 1, fontSize: 17, fontWeight: '700' },
  menuHint: { color: colors.muted, fontSize: 13, marginTop: 4 },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 999,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  section: { color: colors.muted, fontSize: 13, marginTop: 32, marginBottom: 8 },
  sectionHint: { color: colors.muted, fontSize: 13, marginBottom: 10 },
  currentZone: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipBusy: { opacity: 0.6 },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextActive: { color: '#07110d', fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  logout: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 40,
    paddingVertical: 14,
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
