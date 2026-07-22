import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/Calendar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useReminderCalendar } from '@/features/reminders/useCalendar';
import type { AppLanguage } from '@/i18n';
import { formatDate, toDateInputValue } from '@/utils/date';

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const today = toDateInputValue();
  const initial = new Date();

  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const { data, isLoading, isError } = useReminderCalendar(year, month);

  const selectedReminders = useMemo(() => {
    if (!data || !selectedDate) return [];
    return data.reminders.filter((reminder) => reminder.localDate === selectedDate);
  }, [data, selectedDate]);

  const selectedSummary = data?.days.find((day) => day.date === selectedDate);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorMessage message={t('auth.errors.generic')} />;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('calendar.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('calendar.subtitle')}</p>
        <p className="mt-2 text-xs text-muted">
          {t('dashboard.timezone', { timezone: data.timezone })}
        </p>
      </section>

      <Calendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        days={data.days}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        onSelectDate={setSelectedDate}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
            {selectedDate
              ? t('calendar.dayTitle', { date: formatDate(selectedDate, language) })
              : t('calendar.pickDay')}
          </h2>
          {selectedSummary ? (
            <p className="text-sm text-muted">
              {t('calendar.dayCounts', {
                total: selectedSummary.total,
                overdue: selectedSummary.overdue,
                pending: selectedSummary.pending,
                completed: selectedSummary.completed,
              })}
            </p>
          ) : null}
        </div>

        {!selectedDate ? (
          <EmptyState title={t('calendar.pickDay')} description={t('calendar.pickDayDescription')} />
        ) : selectedReminders.length === 0 ? (
          <EmptyState
            title={t('calendar.emptyDayTitle')}
            description={t('calendar.emptyDayDescription')}
          />
        ) : (
          <ul className="space-y-2">
            {selectedReminders.map((reminder) => (
              <li
                key={reminder.id}
                className="rounded-2xl bg-panel px-4 py-3 shadow-sm ring-1 ring-line"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{reminder.material.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {reminder.material.category?.name ?? t('materials.fields.noCategory')} · #
                      {reminder.sequenceNumber} ·{' '}
                      {t(`materials.intervals.${reminder.intervalType}`)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      reminder.status === 'OVERDUE'
                        ? 'danger'
                        : reminder.status === 'COMPLETED'
                          ? 'success'
                          : reminder.status === 'SKIPPED'
                            ? 'neutral'
                            : 'warning'
                    }
                  >
                    {t(`materials.reminderStatus.${reminder.status}`)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/materials/${reminder.material.id}`}>
                    <Button type="button" variant="secondary">
                      {t('review.openMaterial')}
                    </Button>
                  </Link>
                  {(reminder.status === 'PENDING' || reminder.status === 'OVERDUE') && (
                    <Link to="/review">
                      <Button type="button">{t('nav.review')}</Button>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
