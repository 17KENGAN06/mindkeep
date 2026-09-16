import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { detectDeviceTimezone } from '../config/timezones';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useTheme } from '../features/theme/useTheme';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';
import type { MoreStackParamList } from '../navigation/types';

const SITE_URLS = {
  privacy: 'https://mindkeep.cloud/privacy',
} as const;

export function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { theme, colors, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2);
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const timezone = user?.timezone || detectDeviceTimezone();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>{t('tabs.more')}</Text>
        {user ? <Text style={[styles.meta, { color: colors.ink }]}>{user.name}</Text> : null}
        {user ? <Text style={[styles.muted, { color: colors.muted }]}>{user.email}</Text> : null}

        <Pressable
          onPress={() => navigation.navigate('Notes')}
          style={[styles.menuItem, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('notes.title')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('notes.menuHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <View style={styles.menuHead}>
            <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('notifications.title')}</Text>
            {unread > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('notifications.menuHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Finance')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('finance.title')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('finance.menuHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Statistics')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('statistics.title')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('statistics.subtitle')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Blog')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('blog.title')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('blog.subtitle')}</Text>
        </Pressable>

        {user?.role === 'ADMIN' ? (
          <Pressable
            onPress={() => navigation.navigate('Admin')}
            style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('admin.title')}</Text>
            <Text style={[styles.menuHint, { color: colors.muted }]}>{t('admin.subtitle')}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('Guide')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('common.guide')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('common.guideHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Contact')}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('common.contact')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('contact.menuHint')}</Text>
        </Pressable>

        <Pressable
          onPress={() => void Linking.openURL(SITE_URLS.privacy)}
          style={[styles.menuItemTight, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.menuTitle, { color: colors.ink }]}>{t('common.privacy')}</Text>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{t('common.safariHint')}</Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.muted }]}>{t('common.timezone')}</Text>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>{t('common.timezoneHint')}</Text>
        <Text style={[styles.currentZone, { color: colors.ink }]}>
          {t('common.timezoneCurrent', { timezone })}
        </Text>

        <Text style={[styles.section, { color: colors.muted }]}>{t('common.theme')}</Text>
        <View style={styles.row}>
          {([
            { mode: 'light' as const, label: t('common.themeLight') },
            { mode: 'dark' as const, label: t('common.themeDark') },
          ]).map((option) => {
            const active = theme === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setTheme(option.mode)}
                style={[
                  styles.chip,
                  { borderColor: colors.line },
                  active && { backgroundColor: colors.brand, borderColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    { color: colors.ink, fontSize: 14 },
                    active && { color: colors.onBrand, fontWeight: '700' },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>{t('common.language')}</Text>
        <View style={styles.row}>
          {supportedLanguages.map((language) => {
            const active = current === language.code;
            return (
              <Pressable
                key={language.code}
                onPress={() => void setAppLanguage(language.code as AppLanguage)}
                style={[
                  styles.chip,
                  { borderColor: colors.line },
                  active && { backgroundColor: colors.brand, borderColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    { color: colors.ink, fontSize: 14 },
                    active && { color: colors.onBrand, fontWeight: '700' },
                  ]}
                >
                  {language.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => void logout()} style={[styles.logout, { borderColor: colors.line }]}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t('common.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700' },
  meta: { fontSize: 16, marginTop: 16 },
  muted: { fontSize: 14, marginTop: 4 },
  menuItem: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 28,
    padding: 16,
  },
  menuItemTight: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  menuHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  menuTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  menuHint: { fontSize: 13, marginTop: 4 },
  badge: {
    borderRadius: 999,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  section: { fontSize: 13, marginTop: 32, marginBottom: 8 },
  sectionHint: { fontSize: 13, marginBottom: 10 },
  currentZone: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logout: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 40,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
