import type { AppLocale } from '@/services/emailCopy.js';

type ReminderCopyInput = {
  title: string;
  sequence: number;
  daysOverdue: number;
};

type CopyFn = (input: ReminderCopyInput) => { title: string; message: string };

const due: Record<AppLocale, CopyFn> = {
  en: ({ title, sequence }) => ({
    title: 'Review due today',
    message: `${title} · repetition ${sequence}`,
  }),
  ru: ({ title, sequence }) => ({
    title: 'Повторение на сегодня',
    message: `${title} · повтор ${sequence}`,
  }),
  uk: ({ title, sequence }) => ({
    title: 'Повторення на сьогодні',
    message: `${title} · повтор ${sequence}`,
  }),
  pl: ({ title, sequence }) => ({
    title: 'Powtórka na dziś',
    message: `${title} · powtórka ${sequence}`,
  }),
  de: ({ title, sequence }) => ({
    title: 'Wiederholung heute',
    message: `${title} · Wiederholung ${sequence}`,
  }),
  fr: ({ title, sequence }) => ({
    title: 'Révision aujourd’hui',
    message: `${title} · répétition ${sequence}`,
  }),
  it: ({ title, sequence }) => ({
    title: 'Ripasso di oggi',
    message: `${title} · ripetizione ${sequence}`,
  }),
  es: ({ title, sequence }) => ({
    title: 'Repaso de hoy',
    message: `${title} · repetición ${sequence}`,
  }),
  fi: ({ title, sequence }) => ({
    title: 'Kertaus tänään',
    message: `${title} · kertaus ${sequence}`,
  }),
};

const overdue: Record<AppLocale, CopyFn> = {
  en: ({ title, daysOverdue }) => ({
    title: 'Overdue review',
    message: `${title} · ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} late`,
  }),
  ru: ({ title, daysOverdue }) => ({
    title: 'Просроченное повторение',
    message: `${title} · опоздание ${daysOverdue} дн.`,
  }),
  uk: ({ title, daysOverdue }) => ({
    title: 'Прострочене повторення',
    message: `${title} · запізнення ${daysOverdue} дн.`,
  }),
  pl: ({ title, daysOverdue }) => ({
    title: 'Zaległa powtórka',
    message: `${title} · spóźnienie ${daysOverdue} dn.`,
  }),
  de: ({ title, daysOverdue }) => ({
    title: 'Überfällige Wiederholung',
    message: `${title} · ${daysOverdue} Tag${daysOverdue === 1 ? '' : 'e'} überfällig`,
  }),
  fr: ({ title, daysOverdue }) => ({
    title: 'Révision en retard',
    message: `${title} · ${daysOverdue} j. de retard`,
  }),
  it: ({ title, daysOverdue }) => ({
    title: 'Ripasso in ritardo',
    message: `${title} · ${daysOverdue} g. di ritardo`,
  }),
  es: ({ title, daysOverdue }) => ({
    title: 'Repaso atrasado',
    message: `${title} · ${daysOverdue} d. de retraso`,
  }),
  fi: ({ title, daysOverdue }) => ({
    title: 'Myöhässä oleva kertaus',
    message: `${title} · ${daysOverdue} pv myöhässä`,
  }),
};

export function reminderNotificationCopy(
  locale: AppLocale,
  kind: 'due' | 'overdue',
  input: ReminderCopyInput,
): { title: string; message: string } {
  return (kind === 'overdue' ? overdue : due)[locale](input);
}

type TaskCopyInput = {
  title: string;
  date: string;
  minutes: number;
};

const importantTask: Record<AppLocale, (input: TaskCopyInput) => { title: string; message: string }> = {
  en: ({ title, date, minutes }) => ({
    title: 'Important task',
    message: `${title} · ${date} · ${minutes} min`,
  }),
  ru: ({ title, date, minutes }) => ({
    title: 'Важная задача',
    message: `${title} · ${date} · ${minutes} мин`,
  }),
  uk: ({ title, date, minutes }) => ({
    title: 'Важливе завдання',
    message: `${title} · ${date} · ${minutes} хв`,
  }),
  pl: ({ title, date, minutes }) => ({
    title: 'Ważne zadanie',
    message: `${title} · ${date} · ${minutes} min`,
  }),
  de: ({ title, date, minutes }) => ({
    title: 'Wichtige Aufgabe',
    message: `${title} · ${date} · ${minutes} Min.`,
  }),
  fr: ({ title, date, minutes }) => ({
    title: 'Tâche importante',
    message: `${title} · ${date} · ${minutes} min`,
  }),
  it: ({ title, date, minutes }) => ({
    title: 'Attività importante',
    message: `${title} · ${date} · ${minutes} min`,
  }),
  es: ({ title, date, minutes }) => ({
    title: 'Tarea importante',
    message: `${title} · ${date} · ${minutes} min`,
  }),
  fi: ({ title, date, minutes }) => ({
    title: 'Tärkeä tehtävä',
    message: `${title} · ${date} · ${minutes} min`,
  }),
};

export function taskImportantNotificationCopy(
  locale: AppLocale,
  input: TaskCopyInput,
): { title: string; message: string } {
  return importantTask[locale](input);
}
