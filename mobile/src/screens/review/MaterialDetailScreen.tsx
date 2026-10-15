import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MaterialBody } from '../../components/MaterialBody';
import { InlineQueryError, QueryErrorView } from '../../components/QueryState';
import { SourceLink } from '../../components/SourceLink';
import { AppButton, Badge } from '../../components/ui';
import {
  useArchiveMaterial,
  useDeleteMaterial,
  useMaterial,
} from '../../features/materials/useMaterials';
import { ApiError } from '../../api/client';
import { useCompleteReminder, useSkipReminder } from '../../features/reminders/useReminders';
import { useAccountToday } from '../../features/time/useAccountToday';
import { dateKeyInZone } from '../../utils/date';
import { usePullToRefresh } from '../../features/sync/usePullToRefresh';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';
import { fonts } from '../../config/fonts';

export function MaterialDetailScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('materials', 'reminders');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const route = useRoute<RouteProp<ReviewStackParamList, 'MaterialDetail'>>();
  const materialQuery = useMaterial(route.params.id);
  const { data: material, isLoading, isError } = materialQuery;
  const pull = usePullToRefresh(materialQuery);
  const archiveMaterial = useArchiveMaterial();
  const deleteMaterial = useDeleteMaterial();
  const [busy, setBusy] = useState(false);
  const { today, timeZone } = useAccountToday();
  const completeReminder = useCompleteReminder();
  const skipReminder = useSkipReminder();
  const [reviewAction, setReviewAction] = useState<'complete' | 'skip' | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Same actions as on the review page, for the review that is due today or overdue (if any).
  const resolveReview = async (id: string, kind: 'complete' | 'skip') => {
    setReviewAction(kind);
    setReviewError(null);
    setReviewMessage(null);
    try {
      if (kind === 'complete') {
        await completeReminder.mutateAsync(id);
        setReviewMessage(t('review.successCompleted'));
      } else {
        await skipReminder.mutateAsync(id);
        setReviewMessage(t('review.successSkipped'));
      }
    } catch (caught) {
      setReviewError(
        caught instanceof ApiError && caught.code === 'REMINDER_NOT_DUE'
          ? t('review.notDue')
          : t('auth.errors.generic'),
      );
    } finally {
      setReviewAction(null);
    }
  };

  const confirmDelete = () => {
    if (!material) return;
    Alert.alert(t('materials.deleteTitle'), t('materials.deleteDescription', { title: material.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteMaterial.mutateAsync(material.id).then(() => navigation.navigate('Materials'));
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!material) {
    return (
      <QueryErrorView
        error={materialQuery.error}
        onRetry={() => void materialQuery.refetch()}
        retrying={materialQuery.isFetching}
      />
    );
  }

  // Due = scheduled on or before today in the account zone, still open (the server's rule).
  const dueReminder = material.reminders
    .filter(
      (reminder) =>
        (reminder.status === 'PENDING' || reminder.status === 'OVERDUE') &&
        dateKeyInZone(new Date(reminder.scheduledAt), timeZone) <= today,
    )
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))[0];

  return (
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
    >
      {isError ? <InlineQueryError error={materialQuery.error} /> : null}
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.ink }]}>{material.title}</Text>
        {/* Wrapped: the row must not stretch the pill to the height of a long title. */}
        <View style={styles.status}>
          <Badge
            tone={material.status === 'ARCHIVED' ? 'neutral' : 'brand'}
            label={t(`materials.status.${material.status}`)}
          />
        </View>
      </View>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {t('materials.learnedAt')}: {formatDate(material.learnedAt, language)}
      </Text>
      {dueReminder ? (
        <View style={[styles.block, { backgroundColor: `${colors.brand}14`, borderColor: `${colors.brand}55` }]}>
          <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('review.title')}</Text>
          <Text style={[styles.meta, { color: dueReminder.status === 'OVERDUE' ? colors.danger : colors.muted }]}>
            #{dueReminder.sequenceNumber} · {t(`materials.intervals.${dueReminder.intervalType}`)} ·{' '}
            {formatDate(dueReminder.scheduledAt, language)}
          </Text>
          <View style={styles.reviewActions}>
            <AppButton
              label={t('review.completed')}
              loading={reviewAction === 'complete'}
              disabled={reviewAction !== null}
              onPress={() => void resolveReview(dueReminder.id, 'complete')}
            />
            <AppButton
              variant="ghost"
              label={t('review.skip')}
              loading={reviewAction === 'skip'}
              disabled={reviewAction !== null}
              onPress={() => void resolveReview(dueReminder.id, 'skip')}
            />
          </View>
          {reviewError ? <Text style={[styles.meta, { color: colors.danger }]}>{reviewError}</Text> : null}
        </View>
      ) : reviewMessage ? (
        <Text style={[styles.meta, { color: colors.brand }]}>{reviewMessage}</Text>
      ) : null}
      {material.category ? (
        <View style={[styles.labelChip, { backgroundColor: colors.bg, borderColor: colors.line }]}>
          <Text style={[styles.labelKey, { color: colors.muted }]}>{t('materials.fields.category')}</Text>
          <Text style={[styles.labelValue, { color: colors.ink }]}>{material.category.name}</Text>
        </View>
      ) : null}

      {material.content?.trim() ? (
        <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={[styles.sectionHead, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.fields.content')}</Text>
          </View>
          <MaterialBody content={material.content} />
        </View>
      ) : null}

      {material.sourceUrl ? (
        <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.fields.sourceUrl')}</Text>
          <SourceLink href={material.sourceUrl} />
        </View>
      ) : null}

      <View style={[styles.block, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.blockTitle, { color: colors.ink }]}>{t('materials.remindersTitle')}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('materials.remindersSubtitle')}</Text>
        {material.reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderRow}>
            <Text style={[styles.reminderText, { color: colors.ink }]}>
              #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{formatDate(reminder.scheduledAt, language)}</Text>
            <Badge
              tone={
                reminder.status === 'COMPLETED'
                  ? 'brand'
                  : reminder.status === 'OVERDUE'
                    ? 'danger'
                    : reminder.status === 'SKIPPED'
                      ? 'neutral'
                      : 'warn'
              }
              label={t(`materials.reminderStatus.${reminder.status}`)}
            />
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t('common.edit')}
          onPress={() => navigation.navigate('MaterialEdit', { id: material.id })}
        />
        {material.status !== 'ARCHIVED' ? (
          <AppButton
            variant="secondary"
            label={t('materials.archive')}
            loading={archiveMaterial.isPending || busy}
            onPress={() => {
              setBusy(true);
              void archiveMaterial.mutateAsync(material.id).finally(() => setBusy(false));
            }}
          />
        ) : null}
        <AppButton variant="danger" label={t('common.delete')} onPress={confirmDelete} />
      </View>
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  head: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 24, fontFamily: fonts.display, lineHeight: 30 },
  // Centres the pill on the title's first line.
  status: { justifyContent: 'center', minHeight: 30 },
  meta: { fontFamily: fonts.regular, fontSize: 13 },
  labelChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 14,
  },
  labelKey: {
    fontFamily: fonts.bold,
    fontSize: 11,
    includeFontPadding: false,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelValue: { fontFamily: fonts.semibold, fontSize: 14, includeFontPadding: false },
  sectionHead: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  block: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  blockTitle: { fontSize: 15, fontFamily: fonts.bold },
  reminderRow: { gap: 6, marginTop: 8 },
  reminderText: { fontSize: 14, fontFamily: fonts.semibold },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reviewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
