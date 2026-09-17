import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { BrandMark } from '../components/BrandMark';
import { detectDeviceTimezone } from '../config/timezones';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useTheme } from '../features/theme/useTheme';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '../i18n';
import type { MoreStackParamList } from '../navigation/types';

const SITE_URLS = {
  privacy: 'https://mindkeep.cloud/privacy',
} as const;

function MenuCard({
  icon,
  title,
  hint,
  badge,
  first,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  hint: string;
  badge?: string | number;
  first?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        first ? styles.menuItem : styles.menuItemTight,
        { backgroundColor: colors.panel, borderColor: colors.line },
      ]}
    >
      <View style={styles.menuRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.brand}22` }]}>
          <AppIcon name={icon} color={colors.brand} size={20} />
        </View>
        <View style={styles.menuCopy}>
          <View style={styles.menuHead}>
            <Text style={[styles.menuTitle, { color: colors.ink }]}>{title}</Text>
            {badge ? (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.menuHint, { color: colors.muted }]}>{hint}</Text>
        </View>
        <AppIcon name="chevron-forward" color={colors.muted} size={18} />
      </View>
    </Pressable>
  );
}

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
        <View style={styles.profile}>
          <BrandMark size={52} />
          <View style={styles.profileCopy}>
            <Text style={[styles.title, { color: colors.ink }]}>{t('tabs.more')}</Text>
            {user ? <Text style={[styles.meta, { color: colors.ink }]}>{user.name}</Text> : null}
            {user ? <Text style={[styles.muted, { color: colors.muted }]}>{user.email}</Text> : null}
          </View>
        </View>

        <MenuCard
          first
          icon="document-text-outline"
          title={t('notes.title')}
          hint={t('notes.menuHint')}
          onPress={() => navigation.navigate('Notes')}
        />
        <MenuCard
          icon="notifications-outline"
          title={t('notifications.title')}
          hint={t('notifications.menuHint')}
          badge={unread > 0 ? (unread > 99 ? '99+' : unread) : undefined}
          onPress={() => navigation.navigate('Notifications')}
        />
        <MenuCard
          icon="wallet-outline"
          title={t('finance.title')}
          hint={t('finance.menuHint')}
          onPress={() => navigation.navigate('Finance')}
        />
        <MenuCard
          icon="stats-chart-outline"
          title={t('statistics.title')}
          hint={t('statistics.subtitle')}
          onPress={() => navigation.navigate('Statistics')}
        />
        <MenuCard
          icon="newspaper-outline"
          title={t('blog.title')}
          hint={t('blog.subtitle')}
          onPress={() => navigation.navigate('Blog')}
        />
        {user?.role === 'ADMIN' ? (
          <MenuCard
            icon="shield-outline"
            title={t('admin.title')}
            hint={t('admin.subtitle')}
            onPress={() => navigation.navigate('Admin')}
          />
        ) : null}
        <MenuCard
          icon="help-circle-outline"
          title={t('common.guide')}
          hint={t('common.guideHint')}
          onPress={() => navigation.navigate('Guide')}
        />
        <MenuCard
          icon="mail-outline"
          title={t('common.contact')}
          hint={t('contact.menuHint')}
          onPress={() => navigation.navigate('Contact')}
        />
        <MenuCard
          icon="lock-closed-outline"
          title={t('common.privacy')}
          hint={t('common.safariHint')}
          onPress={() => void Linking.openURL(SITE_URLS.privacy)}
        />

        <Text style={[styles.section, { color: colors.muted }]}>{t('common.timezone')}</Text>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>{t('common.timezoneHint')}</Text>
        <Text style={[styles.currentZone, { color: colors.ink }]}>
          {t('common.timezoneCurrent', { timezone })}
        </Text>

        <Text style={[styles.section, { color: colors.muted }]}>{t('common.theme')}</Text>
        <View style={styles.row}>
          {([
            { mode: 'light' as const, label: t('common.themeLight'), icon: 'sunny-outline' as const },
            { mode: 'dark' as const, label: t('common.themeDark'), icon: 'moon-outline' as const },
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
                <AppIcon name={option.icon} color={active ? colors.onBrand : colors.ink} size={16} />
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
          <AppIcon name="log-out-outline" color={colors.danger} size={18} />
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
  profile: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  profileCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700' },
  meta: { fontSize: 16, marginTop: 6 },
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
  menuRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuCopy: { flex: 1 },
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
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logout: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
