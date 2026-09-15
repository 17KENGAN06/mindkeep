import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { ReminderCard } from '../../components/ReminderCard';
import {
  useCompleteReminder,
  useOverdueReminders,
  useSkipReminder,
  useTodayReminders,
  useUpcomingReminders,
} from '../../features/reminders/useReminders';
import type { ReviewStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import type { Reminder } from '../../types/reminder';

function ReminderSection({
  title,
  reminders,
  emptyTitle,
  emptyDescription,
  canResolve,
  pendingId,
  action,
  completePending,
  skipPending,
  onComplete,
  onSkip,
  onOpenMaterial,
}: {
  title: string;
  reminders: Reminder[] | undefined;
  emptyTitle: string;
  emptyDescription: string;
  canResolve: boolean;
  pendingId: string | null;
  action: 'complete' | 'skip' | null;
  completePending: boolean;
  skipPending: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenMaterial: (id: string) => void;
}) {
  if (!reminders) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title} <Text style={styles.count}>({reminders.length})</Text>
      </Text>
      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyDescription}</Text>
        </View>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            canResolve={canResolve}
            actionsDisabled={completePending || skipPending}
            isCompleting={completePending && pendingId === reminder.id && action === 'complete'}
            isSkipping={skipPending && pendingId === reminder.id && action === 'skip'}
            onComplete={onComplete}
            onSkip={onSkip}
            onOpenMaterial={onOpenMaterial}
          />
        ))
      )}
    </View>
  );
}

export function ReviewInboxScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const overdueQuery = useOverdueReminders();
  const todayQuery = useTodayReminders();
  const upcomingQuery = useUpcomingReminders();
  const completeReminder = useCompleteReminder();
  const skipReminder = useSkipReminder();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [action, setAction] = useState<'complete' | 'skip' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = overdueQuery.isLoading || todayQuery.isLoading || upcomingQuery.isLoading;
  const refreshing =
    overdueQuery.isRefetching || todayQuery.isRefetching || upcomingQuery.isRefetching;
  const queryError = overdueQuery.isError || todayQuery.isError || upcomingQuery.isError;
  const totalOpen = (overdueQuery.data?.length ?? 0) + (todayQuery.data?.length ?? 0);

  const onRefresh = () => {
    void overdueQuery.refetch();
    void todayQuery.refetch();
    void upcomingQuery.refetch();
  };

  const resolve = async (id: string, kind: 'complete' | 'skip') => {
    setPendingId(id);
    setAction(kind);
    setError(null);
    setMessage(null);
    try {
      if (kind === 'complete') {
        await completeReminder.mutateAsync(id);
        setMessage(t('review.successCompleted'));
      } else {
        await skipReminder.mutateAsync(id);
        setMessage(t('review.successSkipped'));
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'REMINDER_NOT_DUE'
          ? t('review.notDue')
          : t('auth.errors.generic'),
      );
    } finally {
      setPendingId(null);
      setAction(null);
    }
  };

  const openMaterial = (id: string) => navigation.navigate('MaterialDetail', { id });

  if (loading && !overdueQuery.data && !todayQuery.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing && !loading} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
        <Text style={styles.title}>{t('review.title')}</Text>
        <Text style={styles.subtitle}>{t('review.subtitle')}</Text>
        <Text style={styles.open}>{t('review.openCount', { count: totalOpen })}</Text>

        <View style={styles.shortcuts}>
          <Pressable onPress={() => navigation.navigate('Materials')} style={styles.chip}>
            <Text style={styles.chipText}>{t('materials.title')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Categories')} style={styles.chip}>
            <Text style={styles.chipText}>{t('categories.title')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ReviewCalendar')} style={styles.chip}>
            <Text style={styles.chipText}>{t('calendar.title')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('MaterialCreate')} style={[styles.chip, styles.chipBrand]}>
            <Text style={[styles.chipText, styles.chipBrandText]}>{t('materials.create')}</Text>
          </Pressable>
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error || queryError ? <Text style={styles.error}>{error ?? t('auth.errors.generic')}</Text> : null}

        <ReminderSection
          title={t('review.overdue')}
          reminders={overdueQuery.data}
          emptyTitle={t('review.emptyOverdueTitle')}
          emptyDescription={t('review.emptyOverdueDescription')}
          canResolve
          pendingId={pendingId}
          action={action}
          completePending={completeReminder.isPending}
          skipPending={skipReminder.isPending}
          onComplete={(id) => void resolve(id, 'complete')}
          onSkip={(id) => void resolve(id, 'skip')}
          onOpenMaterial={openMaterial}
        />
        <ReminderSection
          title={t('review.today')}
          reminders={todayQuery.data}
          emptyTitle={t('review.emptyTodayTitle')}
          emptyDescription={t('review.emptyTodayDescription')}
          canResolve
          pendingId={pendingId}
          action={action}
          completePending={completeReminder.isPending}
          skipPending={skipReminder.isPending}
          onComplete={(id) => void resolve(id, 'complete')}
          onSkip={(id) => void resolve(id, 'skip')}
          onOpenMaterial={openMaterial}
        />
        <ReminderSection
          title={t('review.upcoming')}
          reminders={upcomingQuery.data}
          emptyTitle={t('review.emptyUpcomingTitle')}
          emptyDescription={t('review.emptyUpcomingDescription')}
          canResolve={false}
          pendingId={pendingId}
          action={action}
          completePending={completeReminder.isPending}
          skipPending={skipReminder.isPending}
          onComplete={(id) => void resolve(id, 'complete')}
          onSkip={(id) => void resolve(id, 'skip')}
          onOpenMaterial={openMaterial}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg, flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  open: { color: colors.brand, fontSize: 14, fontWeight: '600', marginTop: 8 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipBrand: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  chipBrandText: { color: '#07110d' },
  success: { color: colors.brand, fontSize: 14 },
  error: { color: colors.danger, fontSize: 14 },
  section: { gap: 10, marginTop: 8 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  count: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  empty: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  emptyBody: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
