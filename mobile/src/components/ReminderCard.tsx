import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { Reminder } from '../types/reminder';
import { formatDate } from '../utils/date';
import { MaterialBody } from './MaterialBody';
import { SourceLink } from './SourceLink';
import { AppButton, Badge } from './ui';

type ReminderCardProps = {
  reminder: Reminder;
  canResolve?: boolean;
  actionsDisabled?: boolean;
  isCompleting?: boolean;
  isSkipping?: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenMaterial: (id: string) => void;
};

function statusTone(status: Reminder['status'], daysOverdue: number) {
  if (status === 'OVERDUE' || daysOverdue > 0) return 'danger' as const;
  if (status === 'COMPLETED') return 'brand' as const;
  if (status === 'SKIPPED') return 'neutral' as const;
  return 'warn' as const;
}

export function ReminderCard({
  reminder,
  canResolve = true,
  actionsDisabled = false,
  isCompleting = false,
  isSkipping = false,
  onComplete,
  onSkip,
  onOpenMaterial,
}: ReminderCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { material } = reminder;
  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.title, { color: colors.ink }]}>{material.title}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {material.category?.name ?? t('materials.fields.noCategory')}
          </Text>
        </View>
        <Badge
          tone={statusTone(reminder.status, reminder.daysOverdue)}
          label={t(`materials.reminderStatus.${reminder.status}`)}
        />
      </View>

      <Text style={[styles.row, { color: colors.muted }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>{t('review.learnedAt')}: </Text>
        {formatDate(material.learnedAt, language)}
      </Text>
      <Text style={[styles.row, { color: colors.muted }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>{t('review.sequence')}: </Text>
        #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
      </Text>
      <Text style={[styles.row, { color: colors.muted }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>{t('review.scheduledAt')}: </Text>
        {formatDate(reminder.scheduledAt, language)}
      </Text>
      {reminder.daysOverdue > 0 ? (
        <Text style={[styles.row, { color: colors.danger }]}>
          <Text style={[styles.rowLabel, { color: colors.ink }]}>{t('review.daysOverdue')}: </Text>
          {reminder.daysOverdue}
        </Text>
      ) : null}

      {material.sourceUrl ? (
        <View style={styles.block}>
          <SourceLink href={material.sourceUrl} />
        </View>
      ) : null}

      {material.content?.trim() ? (
        <View style={styles.block}>
          <MaterialBody content={material.content} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t('review.openMaterial')}
          onPress={() => onOpenMaterial(material.id)}
        />
        {canResolve ? (
          <>
            <AppButton
              label={t('review.completed')}
              loading={isCompleting}
              disabled={actionsDisabled}
              onPress={() => onComplete(reminder.id)}
            />
            <AppButton
              variant="ghost"
              label={t('review.skip')}
              loading={isSkipping}
              disabled={actionsDisabled}
              onPress={() => onSkip(reminder.id)}
            />
          </>
        ) : (
          <Text style={[styles.notDue, { color: colors.muted }]}>{t('review.notDue')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  headText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  row: { fontSize: 14, marginTop: 8 },
  rowLabel: { fontWeight: '600' },
  block: { marginTop: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  notDue: { fontSize: 13, flex: 1, paddingVertical: 10 },
});
