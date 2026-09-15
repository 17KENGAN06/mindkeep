import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../i18n';
import { colors } from '../theme';
import type { Reminder } from '../types/reminder';
import { formatDate } from '../utils/date';
import { AnswerReveal } from './AnswerReveal';
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
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { material } = reminder;
  const hasFlashcard = Boolean(material.question?.trim() && material.answer?.trim());

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{material.title}</Text>
          <Text style={styles.meta}>{material.category?.name ?? t('materials.fields.noCategory')}</Text>
        </View>
        <Badge
          tone={statusTone(reminder.status, reminder.daysOverdue)}
          label={t(`materials.reminderStatus.${reminder.status}`)}
        />
      </View>

      <Text style={styles.row}>
        <Text style={styles.rowLabel}>{t('review.learnedAt')}: </Text>
        {formatDate(material.learnedAt, language)}
      </Text>
      <Text style={styles.row}>
        <Text style={styles.rowLabel}>{t('review.sequence')}: </Text>
        #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
      </Text>
      <Text style={styles.row}>
        <Text style={styles.rowLabel}>{t('review.scheduledAt')}: </Text>
        {formatDate(reminder.scheduledAt, language)}
      </Text>
      {reminder.daysOverdue > 0 ? (
        <Text style={[styles.row, styles.overdue]}>
          <Text style={styles.rowLabel}>{t('review.daysOverdue')}: </Text>
          {reminder.daysOverdue}
        </Text>
      ) : null}

      {hasFlashcard ? (
        <View style={styles.block}>
          <AnswerReveal question={material.question!} answer={material.answer!} />
        </View>
      ) : null}

      {!hasFlashcard && material.content?.trim() ? (
        <Text style={styles.content} numberOfLines={8}>
          {material.content}
        </Text>
      ) : null}

      {hasFlashcard && material.content?.trim() ? (
        <Text style={styles.notes} numberOfLines={6}>
          {material.content}
        </Text>
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
          <Text style={styles.notDue}>{t('review.notDue')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  headText: { flex: 1 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  row: { color: colors.muted, fontSize: 14, marginTop: 8 },
  rowLabel: { color: colors.ink, fontWeight: '600' },
  overdue: { color: colors.danger },
  block: { marginTop: 14 },
  content: { color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 14 },
  notes: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  notDue: { color: colors.muted, fontSize: 13, flex: 1, paddingVertical: 10 },
});
