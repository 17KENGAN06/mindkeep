import { Fragment, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { BrandMark } from '../components/BrandMark';
import { userHasModule } from '../config/appModules';
import { isProAccount } from '../features/billing/planLimit';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useDashboardStatistics } from '../features/statistics/useStatistics';
import { useTodayTasks } from '../features/tasks/useDailyTasks';
import { useAccountToday } from '../features/time/useAccountToday';
import { useTheme } from '../features/theme/useTheme';
import type { MoreStackParamList } from '../navigation/types';

const SITE_URLS = {
  privacy: 'https://mindkeep.cloud/privacy',
} as const;

type MenuItem = {
  key: string;
  icon: AppIconName;
  title: string;
  /** Short value on the right (plan, count) instead of a long hint. */
  value?: string;
  badge?: string | number;
  external?: boolean;
  onPress: () => void;
};

/** One grouped card of rows (settings-style), like the site's grouped mobile menu. */
function MenuGroup({ title, items }: { title: string; items: MenuItem[] }) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: colors.muted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        {items.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.line }]} /> : null}
            <Pressable
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: `${colors.brand}12` }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.brand}22` }]}>
                <AppIcon name={item.icon} color={colors.brand} size={19} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={1}>
                {item.title}
              </Text>
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              {item.value ? (
                <Text style={[styles.rowValue, { color: colors.muted }]} numberOfLines={1}>
                  {item.value}
                </Text>
              ) : null}
              <AppIcon
                name={item.external ? 'open-outline' : 'chevron-forward'}
                color={colors.muted}
                size={18}
              />
            </Pressable>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

type Tile = { key: string; icon: AppIconName; title: string; meta?: string; onPress: () => void };

/** Big two-column tiles for the sections people open most (the hub's main block). */
function TileGrid({ tiles }: { tiles: Tile[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          onPress={tile.onPress}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: colors.panel, borderColor: colors.line },
            pressed && { backgroundColor: `${colors.brand}12` },
          ]}
        >
          <View style={[styles.tileIcon, { backgroundColor: `${colors.brand}22` }]}>
            <AppIcon name={tile.icon} color={colors.brand} size={22} />
          </View>
          <Text style={[styles.tileTitle, { color: colors.ink }]} numberOfLines={1}>
            {tile.title}
          </Text>
          <Text style={[styles.tileMeta, { color: tile.meta ? colors.brand : colors.muted }]} numberOfLines={1}>
            {tile.meta ?? ' '}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProfileCard({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.profile,
        { backgroundColor: colors.panel, borderColor: colors.line },
        pressed && { backgroundColor: `${colors.brand}12` },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const planLabel = isProAccount(user)
    ? t(user?.plan === 'PLUS' ? 'billing.plusLabel' : 'billing.proLabel')
    : t('billing.freeLabel');

  const { today } = useAccountToday();
  const showTasks = userHasModule(user, 'tasks');
  const showReview = userHasModule(user, 'review');
  const tasksQuery = useTodayTasks(today, showTasks);
  const statsQuery = useDashboardStatistics();
  const pendingTasks = tasksQuery.data?.totals?.pending ?? 0;
  const dueReviews = (statsQuery.data?.stats.todayReminders ?? 0) + (statsQuery.data?.stats.overdueReminders ?? 0);
  // Opens a section inside this stack (the hub stays underneath for Back).
  const open = (screen: 'TasksHome' | 'ReviewInbox' | 'Fuel' | 'Notes' | 'Rhythm' | 'Finance' | 'Statistics') =>
    navigation.navigate(screen);

  const tiles: Tile[] = [
    showTasks
      ? { key: 'tasks', icon: 'checkbox-outline', title: t('tabs.tasks'), meta: pendingTasks > 0 ? t('hub.tasksToday', { count: pendingTasks }) : undefined, onPress: () => open('TasksHome') }
      : null,
    showReview
      ? { key: 'review', icon: 'sync-outline', title: t('tabs.review'), meta: dueReviews > 0 ? t('hub.reviewsDue', { count: dueReviews }) : undefined, onPress: () => open('ReviewInbox') }
      : null,
    userHasModule(user, 'nutrition') ? { key: 'fuel', icon: 'restaurant-outline', title: t('tabs.fuel'), onPress: () => open('Fuel') } : null,
    userHasModule(user, 'notes') ? { key: 'notes', icon: 'document-text-outline', title: t('notes.title'), onPress: () => open('Notes') } : null,
    userHasModule(user, 'habits') ? { key: 'rhythm', icon: 'repeat-outline', title: t('rhythm.title'), onPress: () => open('Rhythm') } : null,
    userHasModule(user, 'finance') ? { key: 'finance', icon: 'wallet-outline', title: t('finance.title'), onPress: () => open('Finance') } : null,
    { key: 'statistics', icon: 'stats-chart-outline', title: t('statistics.title'), onPress: () => open('Statistics') },
  ].filter((tile): tile is Tile => tile !== null);

  const account: MenuItem[] = [
    {
      key: 'notifications',
      icon: 'notifications-outline',
      title: t('notifications.title'),
      badge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
      onPress: () => navigation.navigate('Notifications'),
    },
    { key: 'account', icon: 'person-outline', title: t('auth.accountTitle'), value: planLabel, onPress: () => navigation.navigate('Account') },
    { key: 'settings', icon: 'settings-outline', title: t('settings.title'), onPress: () => navigation.navigate('Settings') },
  ];

  const help: MenuItem[] = [
    { key: 'guide', icon: 'help-circle-outline', title: t('common.guide'), onPress: () => navigation.navigate('Guide') },
    { key: 'blog', icon: 'newspaper-outline', title: t('blog.title'), onPress: () => navigation.navigate('Blog') },
    { key: 'contact', icon: 'mail-outline', title: t('common.contact'), onPress: () => navigation.navigate('Contact') },
    {
      key: 'privacy',
      icon: 'lock-closed-outline',
      title: t('common.privacy'),
      external: true,
      onPress: () => void Linking.openURL(SITE_URLS.privacy),
    },
  ];

  const admin: MenuItem[] =
    user?.role === 'ADMIN'
      ? [{ key: 'admin', icon: 'shield-outline', title: t('admin.title'), onPress: () => navigation.navigate('Admin') }]
      : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>{t('tabs.sections')}</Text>

        <ProfileCard onPress={() => navigation.navigate('Account')}>
          <BrandMark size={44} />
          <View style={styles.profileCopy}>
            {user ? (
              <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                {user.name}
              </Text>
            ) : null}
            {user ? (
              <Text style={[styles.email, { color: colors.muted }]} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
          <View style={[styles.planChip, { backgroundColor: `${colors.brand}22` }]}>
            <Text style={[styles.planText, { color: colors.brand }]}>{planLabel}</Text>
          </View>
        </ProfileCard>

        <TileGrid tiles={tiles} />
        <MenuGroup title={t('more.sections.account')} items={account} />
        <MenuGroup title={t('more.sections.help')} items={help} />
        <MenuGroup title={t('more.sections.admin')} items={admin} />

        <Pressable
          accessibilityRole="button"
          onPress={() => void logout()}
          style={[styles.logout, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
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
  content: { gap: 22, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  profile: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  planChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  planText: { fontSize: 13, fontWeight: '700' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 6,
    minHeight: 112,
    padding: 14,
  },
  tileIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', marginBottom: 4, width: 40 },
  tileTitle: { fontSize: 16, fontWeight: '700' },
  tileMeta: { fontSize: 13, fontWeight: '600' },
  group: { gap: 8 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  rowValue: { fontSize: 14, maxWidth: 110 },
  badge: { borderRadius: 999, minWidth: 22, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  logout: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
