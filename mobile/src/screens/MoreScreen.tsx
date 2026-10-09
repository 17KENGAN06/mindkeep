import { Fragment, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { BrandMark } from '../components/BrandMark';
import { CardSheen } from '../components/CardSheen';
import { GradientIcon } from '../components/GradientIcon';
import { userHasModule } from '../config/appModules';
import { isProAccount } from '../features/billing/planLimit';
import { useAuth } from '../features/auth/useAuth';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useDashboardStatistics } from '../features/statistics/useStatistics';
import { useTodayTasks } from '../features/tasks/useDailyTasks';
import { useAccountToday } from '../features/time/useAccountToday';
import { useTheme } from '../features/theme/useTheme';
import type { MoreStackParamList } from '../navigation/types';
import { fonts } from '../config/fonts';
import { AmbientGlow } from '../components/AmbientGlow';

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
      <View style={[styles.card, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}>
        {items.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.line }]} /> : null}
            <Pressable
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: `${colors.brand}12` }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.brand}1a`, borderColor: `${colors.brand}33` }]}>
                <AppIcon name={item.icon} color={colors.brand} size={18} />
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

type Tile = {
  key: string;
  icon: AppIconName;
  title: string;
  /** One calm line about the section. */
  description: string;
  /** Live count (tasks left, reviews due): a number pill; meta is its spoken label. */
  count?: number;
  meta?: string;
  onPress: () => void;
};

const TILE_RADIUS = 26;

/** Big two-column tiles for the sections people open most (the hub's main block). */
function TileGrid({ tiles }: { tiles: Tile[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          accessibilityLabel={tile.count ? `${tile.title}, ${tile.meta}` : tile.title}
          onPress={tile.onPress}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: colors.panel },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          {({ pressed }) => (
            <>
              <CardSheen glow={pressed ? 0.34 : 0.2} radius={TILE_RADIUS} />
              {/* Large faint icon in the corner, like a watermark. */}
              <View pointerEvents="none" style={styles.tileWatermark}>
                <AppIcon name={tile.icon} color={`${colors.brand}12`} size={112} />
              </View>

              <View style={styles.tileTop}>
                <GradientIcon name={tile.icon} size={46} />
                {tile.count ? (
                  <View style={[styles.tileMeta, { backgroundColor: `${colors.brand}1f`, borderColor: `${colors.brand}40` }]}>
                    <View style={[styles.tileMetaDot, { backgroundColor: colors.brand }]} />
                    <Text style={[styles.tileMetaText, { color: colors.brand }]} numberOfLines={1}>
                      {tile.count > 99 ? '99+' : tile.count}
                    </Text>
                  </View>
                ) : (
                  <AppIcon name="chevron-forward" color={colors.muted} size={18} />
                )}
              </View>

              <View style={styles.tileBody}>
                <Text style={[styles.tileTitle, { color: colors.ink }]} numberOfLines={1}>
                  {tile.title}
                </Text>
                <Text style={[styles.tileDescription, { color: colors.muted }]} numberOfLines={2}>
                  {tile.description}
                </Text>
              </View>
            </>
          )}
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
        { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
        pressed && { backgroundColor: `${colors.brand}14` },
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

  const tiles: Tile[] = ([
    showTasks
      ? { key: 'tasks', icon: 'checkbox-outline', title: t('tabs.tasks'), description: t('hub.desc.tasks'), count: pendingTasks, meta: t('hub.tasksToday', { count: pendingTasks }), onPress: () => open('TasksHome') }
      : null,
    showReview
      ? { key: 'review', icon: 'school-outline', title: t('tabs.review'), description: t('hub.desc.review'), count: dueReviews, meta: t('hub.reviewsDue', { count: dueReviews }), onPress: () => open('ReviewInbox') }
      : null,
    userHasModule(user, 'nutrition') ? { key: 'fuel', icon: 'restaurant-outline', title: t('tabs.fuel'), description: t('hub.desc.fuel'), onPress: () => open('Fuel') } : null,
    userHasModule(user, 'notes') ? { key: 'notes', icon: 'document-text-outline', title: t('notes.title'), description: t('hub.desc.notes'), onPress: () => open('Notes') } : null,
    userHasModule(user, 'habits') ? { key: 'rhythm', icon: 'repeat-outline', title: t('rhythm.title'), description: t('hub.desc.rhythm'), onPress: () => open('Rhythm') } : null,
    userHasModule(user, 'finance') ? { key: 'finance', icon: 'wallet-outline', title: t('finance.title'), description: t('hub.desc.finance'), onPress: () => open('Finance') } : null,
    { key: 'statistics', icon: 'stats-chart-outline', title: t('statistics.title'), description: t('hub.desc.statistics'), onPress: () => open('Statistics') },
  ] as (Tile | null)[]).filter((tile): tile is Tile => tile !== null);

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
      <AmbientGlow />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>Mindkeep</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{t('tabs.sections')}</Text>
        </View>

        <ProfileCard onPress={() => navigation.navigate('Account')}>
          <View style={[styles.avatar, { backgroundColor: `${colors.brand}1f`, borderColor: `${colors.brand}55` }]}>
            {user?.name?.trim() ? (
              <Text style={[styles.avatarText, { color: colors.brand }]}>{user.name.trim().charAt(0).toUpperCase()}</Text>
            ) : (
              <BrandMark size={30} />
            )}
          </View>
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
          style={({ pressed }) => [
            styles.logout,
            { borderColor: `${colors.danger}40` },
            pressed && { backgroundColor: `${colors.danger}14` },
          ]}
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
  content: { gap: 24, paddingBottom: 36, paddingHorizontal: 20, paddingTop: 16 },
  eyebrow: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2.6, textTransform: 'uppercase' },
  title: { fontSize: 30, fontFamily: fonts.display, letterSpacing: -0.6, marginTop: 6 },
  profile: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  avatar: { alignItems: 'center', borderRadius: 18, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  avatarText: { fontFamily: fonts.display, fontSize: 20 },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontFamily: fonts.bold },
  email: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  planChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  planText: { fontSize: 13, fontFamily: fonts.bold },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderRadius: TILE_RADIUS,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 164,
    overflow: 'hidden',
    padding: 16,
  },
  tileWatermark: { bottom: -26, opacity: 1, position: 'absolute', right: -22, transform: [{ rotate: '-14deg' }] },
  tileTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  tileBody: { flex: 1, gap: 5, justifyContent: 'flex-end', marginTop: 20 },
  tileTitle: { fontFamily: fonts.display, fontSize: 16, letterSpacing: -0.3 },
  tileDescription: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  tileMeta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tileMetaDot: { borderRadius: 999, height: 6, width: 6 },
  tileMetaText: { fontFamily: fonts.bold, fontSize: 12 },
  group: { gap: 8 },
  groupTitle: {
    fontSize: 11,
    fontFamily: fonts.display,
    letterSpacing: 2,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
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
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rowTitle: { flex: 1, fontSize: 16, fontFamily: fonts.semibold },
  rowValue: { fontFamily: fonts.regular, fontSize: 14, maxWidth: 110 },
  badge: { borderRadius: 999, minWidth: 22, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: fonts.bold, textAlign: 'center' },
  logout: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  logoutText: { fontSize: 16, fontFamily: fonts.semibold },
});
