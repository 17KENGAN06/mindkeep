import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AmbientGlow } from '../../components/AmbientGlow';
import { AppIcon } from '../../components/AppIcon';
import { fonts } from '../../config/fonts';
import { useOverdueReminders, useTodayReminders } from '../reminders/useReminders';
import { useTheme } from '../theme/useTheme';
import { useNotifications, useNotificationSummary } from './useNotifications';

/** Where a bell item leads inside the Sections stack. */
export type BellTarget =
  | { screen: 'TasksHome' | 'ReviewInbox' | 'Notifications' }
  | { screen: 'MaterialDetail'; params: { id: string } };

type NotificationBellProps = {
  onOpen: (target: BellTarget) => void;
};

/**
 * The site's header bell: a badge with everything waiting (important tasks, reviews due today,
 * overdue reviews) and a panel listing them.
 */
export function NotificationBell({ onOpen }: NotificationBellProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const summary = useNotificationSummary().data;
  const waiting = (summary?.dueToday ?? 0) + (summary?.overdue ?? 0) + (summary?.important ?? 0);
  const badge = Math.max(waiting, summary?.unreadCount ?? 0);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('notifications.title')}
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: `${colors.panel}e6`, borderColor: badge > 0 ? `${colors.brand}66` : colors.line },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <AppIcon name="notifications-outline" color={badge > 0 ? colors.brand : colors.ink} size={20} />
        {badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.bg }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaProvider>
          <BellPanel
            onClose={() => setOpen(false)}
            onOpen={(target) => {
              setOpen(false);
              onOpen(target);
            }}
          />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

function BellPanel({ onClose, onOpen }: { onClose: () => void; onOpen: (target: BellTarget) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const summary = useNotificationSummary().data;
  const inbox = useNotifications();
  const today = useTodayReminders();
  const overdue = useOverdueReminders();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void inbox.refetch();
    Animated.timing(rise, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
    // Refetch once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const important = (inbox.data?.notifications ?? []).filter((item) => item.type === 'TASK_IMPORTANT');
  const dueToday = today.data ?? [];
  const late = overdue.data ?? [];
  const counts = [
    important.length ? t('notifications.importantCount', { count: important.length }) : null,
    t('notifications.dueCount', { count: dueToday.length || summary?.dueToday || 0 }),
    t('notifications.overdueCount', { count: late.length || summary?.overdue || 0 }),
  ].filter(Boolean);

  return (
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.bg, borderColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) + 6 },
          { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) }] },
        ]}
      >
        <AmbientGlow />
        <View style={[styles.grabber, { backgroundColor: colors.line }]} />
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text style={[styles.eyebrow, { color: colors.brand }]}>Mindkeep</Text>
            <Text style={[styles.title, { color: colors.ink }]}>{t('notifications.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={2}>
              {counts.join(' · ')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            onPress={onClose}
            style={[styles.close, { backgroundColor: `${colors.panel}e6`, borderColor: colors.line }]}
          >
            <AppIcon name="close" color={colors.ink} size={20} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Section
            title={`${t('notifications.bellImportant')} · ${important.length}`}
            tone={colors.warn}
            empty={t('notifications.bellEmptyImportant')}
            items={important.map((item) => ({
              key: item.id,
              icon: 'flag' as const,
              label: item.dailyTask?.title ?? item.message,
              onPress: () => onOpen({ screen: 'TasksHome' }),
            }))}
          />
          <Section
            title={`${t('notifications.bellToday')} · ${dueToday.length}`}
            tone={colors.brand}
            empty={t('review.emptyTodayTitle')}
            items={dueToday.map((reminder) => ({
              key: reminder.id,
              icon: 'school-outline' as const,
              label: reminder.material.title,
              onPress: () => onOpen({ screen: 'MaterialDetail', params: { id: reminder.material.id } }),
            }))}
          />
          <Section
            title={`${t('notifications.bellOverdue')} · ${late.length}`}
            tone={colors.danger}
            empty={t('notifications.bellEmptyOverdue')}
            items={late.map((reminder) => ({
              key: reminder.id,
              icon: 'school-outline' as const,
              label: reminder.material.title,
              onPress: () => onOpen({ screen: 'MaterialDetail', params: { id: reminder.material.id } }),
            }))}
          />
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen({ screen: 'Notifications' })}
            style={({ pressed }) => [styles.primary, { backgroundColor: colors.brand }, pressed && styles.pressed]}
          >
            <Text style={[styles.primaryText, { color: colors.onBrand }]}>{t('notifications.seeAll')}</Text>
            <AppIcon name="arrow-forward" color={colors.onBrand} size={16} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen({ screen: 'ReviewInbox' })}
            style={({ pressed }) => [
              styles.secondary,
              { borderColor: colors.line, backgroundColor: `${colors.panel}e6` },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('notifications.openReviews')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

type SectionItem = { key: string; icon: 'flag' | 'school-outline'; label: string; onPress: () => void };

function Section({ title, tone, empty, items }: { title: string; tone: string; empty: string; items: SectionItem[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: `${colors.panel}e6`, borderColor: items.length ? `${tone}55` : colors.line }]}>
      <Text style={[styles.sectionTitle, { color: items.length ? tone : colors.muted }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{empty}</Text>
      ) : (
        items.slice(0, 6).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: `${tone}1a` }]}
          >
            <View style={[styles.itemIcon, { backgroundColor: `${tone}1f` }]}>
              <AppIcon name={item.icon} color={tone} size={15} />
            </View>
            <Text style={[styles.itemText, { color: colors.ink }]} numberOfLines={1}>
              {item.label}
            </Text>
            <AppIcon name="chevron-forward" color={colors.muted} size={16} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  badgeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 10.5 },
  backdrop: { backgroundColor: 'rgba(3,8,6,0.68)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    gap: 14,
    maxHeight: '88%',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', borderRadius: 999, height: 4, width: 44 },
  head: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  headCopy: { flex: 1 },
  eyebrow: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.3, marginTop: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 6 },
  close: { alignItems: 'center', borderRadius: 14, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  list: { flexGrow: 0 },
  listContent: { gap: 10 },
  section: { borderRadius: 22, borderWidth: 1, gap: 2, padding: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, marginBottom: 6, paddingHorizontal: 4, textTransform: 'uppercase' },
  empty: { fontFamily: fonts.regular, fontSize: 13, paddingHorizontal: 4, paddingVertical: 4 },
  item: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 10, minHeight: 44, paddingHorizontal: 6 },
  itemIcon: { alignItems: 'center', borderRadius: 10, height: 28, justifyContent: 'center', width: 28 },
  itemText: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5 },
  actions: { gap: 10 },
  primary: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52 },
  primaryText: { fontFamily: fonts.semibold, fontSize: 15.5 },
  secondary: { alignItems: 'center', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 50 },
  secondaryText: { fontFamily: fonts.bold, fontSize: 15 },
  pressed: { opacity: 0.88 },
});
