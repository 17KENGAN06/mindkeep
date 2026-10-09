import { Fragment, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { GradientIcon } from '../../components/GradientIcon';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

const CARD_RADIUS = 24;
/** Rows per group before "N more". */
const VISIBLE = 3;

export type NowItem =
  | { kind: 'overdue' | 'review'; id: string; title: string; materialId: string }
  | { kind: 'task'; id: string; title: string; minutes: number; important: boolean };

type ReviewItem = Extract<NowItem, { kind: 'overdue' | 'review' }>;
type TaskItem = Extract<NowItem, { kind: 'task' }>;

type NowFeedProps = {
  /** Already in urgency order: overdue reviews, today's reviews; important tasks, the rest. */
  items: NowItem[];
  /** Tasks already ticked today (shown as a quiet line under the list). */
  doneToday: number;
  busyTaskId: string | null;
  onToggleTask: (id: string) => void;
  onOpenReview: (materialId: string) => void;
  onOpenReviews: () => void;
  onOpenTasks: () => void;
};

type GroupProps<T> = {
  icon: AppIconName;
  title: string;
  items: T[];
  /** Group has something overdue: header count turns red. */
  urgent?: boolean;
  onOpenAll: () => void;
  renderRow: (item: T) => React.ReactNode;
};

/** One group of the "Now" card on its own inset panel: header, up to three rows, "N more". */
function Group<T extends { id: string; kind: string }>({
  icon,
  title,
  items,
  urgent,
  onOpenAll,
  renderRow,
}: GroupProps<T>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, VISIBLE);
  const hidden = items.length - shown.length;
  const tone = urgent ? colors.danger : colors.brand;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    setExpanded((value) => !value);
  };

  return (
    <View style={[styles.group, { backgroundColor: `${colors.bg}8c`, borderColor: colors.line }]}>
      <View style={styles.groupHead}>
        <View style={[styles.groupIcon, { backgroundColor: `${colors.brand}1f` }]}>
          <AppIcon name={icon} color={colors.brand} size={14} />
        </View>
        <Text style={[styles.groupTitle, { color: colors.ink }]}>{title}</Text>
        <View style={[styles.count, { backgroundColor: `${tone}1f` }]}>
          <Text style={[styles.countText, { color: tone }]}>{items.length}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onOpenAll} hitSlop={8} style={styles.all}>
          <Text style={[styles.allText, { color: colors.muted }]}>{t('todayHub.now.all')}</Text>
          <AppIcon name="chevron-forward" color={colors.muted} size={14} />
        </Pressable>
      </View>

      {shown.map((item, index) => (
        <Fragment key={`${item.kind}-${item.id}`}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.line }]} /> : null}
          {renderRow(item)}
        </Fragment>
      ))}

      {hidden > 0 || expanded ? (
        <Pressable accessibilityRole="button" onPress={toggle} hitSlop={6} style={styles.more}>
          <Text style={[styles.moreText, { color: colors.brand }]}>
            {expanded ? t('todayHub.now.less') : t('todayHub.now.more', { count: hidden })}
          </Text>
          <View style={expanded ? styles.chevronUp : undefined}>
            <AppIcon name="chevron-down" color={colors.brand} size={14} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * "Now": what needs an action today, split into reviews and tasks so the two never mix.
 * Each group keeps its own urgency order and opens its section from the header.
 */
export function NowFeed({
  items,
  doneToday,
  busyTaskId,
  onToggleTask,
  onOpenReview,
  onOpenReviews,
  onOpenTasks,
}: NowFeedProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reviews = items.filter((item): item is ReviewItem => item.kind !== 'task');
  const tasks = items.filter((item): item is TaskItem => item.kind === 'task');

  const reviewRow = (item: ReviewItem) => {
    const overdue = item.kind === 'overdue';
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onOpenReview(item.materialId)}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: `${colors.brand}0f` }]}
      >
        <View style={[styles.dot, { backgroundColor: overdue ? colors.danger : colors.brand }]} />
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: overdue ? colors.danger : colors.muted }]}>
          {overdue ? t('todayHub.now.overdue') : t('todayHub.now.today')}
        </Text>
        <AppIcon name="chevron-forward" color={colors.muted} size={15} />
      </Pressable>
    );
  };

  const taskRow = (item: TaskItem) => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: false, busy: busyTaskId === item.id }}
      disabled={busyTaskId === item.id}
      onPress={() => onToggleTask(item.id)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: `${colors.brand}0f` }]}
    >
      <View style={[styles.check, { borderColor: item.important ? colors.warn : colors.line }]}>
        {busyTaskId === item.id ? <ActivityIndicator size="small" color={colors.brand} /> : null}
      </View>
      <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
        {item.title}
      </Text>
      {item.important ? (
        <View style={[styles.tag, { backgroundColor: `${colors.warn}1f` }]}>
          <AppIcon name="flag" color={colors.warn} size={12} />
          <Text style={[styles.tagText, { color: colors.warn }]}>
            {t('todayHub.now.important')}
          </Text>
        </View>
      ) : (
        <Text style={[styles.meta, { color: colors.muted }]}>
          {item.minutes} {t('today.min')}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.panel }]}>
      <CardSheen glow={0.16} radius={CARD_RADIUS} />
      <Text style={[styles.eyebrow, { color: colors.brand }]}>{t('todayHub.now.title')}</Text>

      {items.length === 0 ? (
        <View style={styles.done}>
          <GradientIcon name="checkmark-done-outline" size={44} />
          <View style={styles.doneCopy}>
            <Text style={[styles.doneTitle, { color: colors.ink }]}>
              {t('todayHub.now.allDone')}
            </Text>
            <Text style={[styles.doneHint, { color: colors.muted }]}>
              {t('todayHub.now.allDoneHint')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.groups}>
          {reviews.length > 0 ? (
            <Group
              icon="school-outline"
              title={t('todayHub.now.reviews')}
              items={reviews}
              urgent={reviews.some((item) => item.kind === 'overdue')}
              onOpenAll={onOpenReviews}
              renderRow={reviewRow}
            />
          ) : null}
          {tasks.length > 0 ? (
            <Group
              icon="checkbox-outline"
              title={t('todayHub.now.tasks')}
              items={tasks}
              onOpenAll={onOpenTasks}
              renderRow={taskRow}
            />
          ) : null}
        </View>
      )}

      {doneToday > 0 ? (
        <Text style={[styles.doneToday, { color: colors.muted }]}>
          {t('todayHub.now.doneToday', { count: doneToday })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: CARD_RADIUS, marginBottom: 14, overflow: 'hidden', padding: 16 },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 2.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  groups: { gap: 10 },
  group: {
    borderRadius: 18,
    borderWidth: 1,
    paddingBottom: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  groupHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  groupIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  groupTitle: { fontFamily: fonts.bold, fontSize: 14 },
  count: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  countText: { fontFamily: fonts.bold, fontSize: 11 },
  all: { alignItems: 'center', flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  allText: { fontFamily: fonts.medium, fontSize: 12.5 },
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 4,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 38 },
  dot: { borderRadius: 999, height: 8, marginHorizontal: 8, width: 8 },
  check: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  title: { flex: 1, fontFamily: fonts.medium, fontSize: 15 },
  meta: { fontFamily: fonts.medium, fontSize: 12 },
  tag: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontFamily: fonts.semibold, fontSize: 11 },
  done: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 4 },
  doneCopy: { flex: 1, gap: 3 },
  doneTitle: { fontFamily: fonts.bold, fontSize: 15.5 },
  doneHint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  more: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  moreText: { fontFamily: fonts.semibold, fontSize: 13 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  doneToday: { fontFamily: fonts.regular, fontSize: 12.5, marginTop: 12, paddingHorizontal: 4 },
});
