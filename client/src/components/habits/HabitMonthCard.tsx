import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { AppLanguage } from '@/i18n';
import type { RhythmHabit } from '@/types/rhythm';
import { monthCells, weekdayLabels } from '@/utils/date';

type HabitMonthCardProps = {
  habit: RhythmHabit;
  year: number;
  month: number;
  today: string;
  cycleDays: number;
  language: AppLanguage;
  busy?: boolean;
  onToggle: (date: string, done: boolean) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
};

function visibleMonthCells(year: number, month: number) {
  const cells = monthCells(year, month);
  let last = cells.length - 1;
  while (last >= 0 && !cells[last]?.inMonth) last -= 1;
  return cells.slice(0, Math.ceil((last + 1) / 7) * 7);
}

export function HabitMonthCard({
  habit,
  year,
  month,
  today,
  cycleDays,
  language,
  busy,
  onToggle,
  onRename,
  onDelete,
}: HabitMonthCardProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habit.title);
  const checkSet = new Set(habit.checks);
  const cells = visibleMonthCells(year, month);
  const labels = weekdayLabels(language);
  const percent = Math.round((habit.done / Math.max(habit.target, 1)) * 100);

  const commitRename = () => {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === habit.title) {
      setDraft(habit.title);
      return;
    }
    onRename(next);
  };

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              className="w-full min-w-0 rounded-xl border border-brand-400 bg-panel px-3 py-1.5 text-base font-semibold text-ink outline-none"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === 'Escape') {
                  setDraft(habit.title);
                  setEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="block w-full truncate text-left text-base font-semibold text-ink"
              onClick={() => {
                setDraft(habit.title);
                setEditing(true);
              }}
            >
              {habit.title}
            </button>
          )}
          <p className="mt-1 text-xs text-muted">
            {t('rhythm.streak', { count: habit.streak })} · {habit.lifetime}/{cycleDays}
          </p>
        </div>
        {habit.formed ? <Badge>{t('rhythm.formed')}</Badge> : null}
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-brand-50 hover:text-ink"
          aria-label={t('common.delete')}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-7 gap-1">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} className="text-center text-[10px] font-medium uppercase text-muted">
            {label}
          </span>
        ))}
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <span key={cell.date} className="aspect-square min-w-0" />;
          }
          const done = checkSet.has(cell.date);
          const future = cell.date > today;
          const isToday = cell.date === today;
          return (
            <button
              key={cell.date}
              type="button"
              disabled={future || busy}
              aria-pressed={done}
              aria-label={`${habit.title} ${cell.date}`}
              onClick={() => onToggle(cell.date, done)}
              className={`flex aspect-square min-w-0 items-center justify-center rounded-xl text-xs font-medium transition ${
                done
                  ? 'bg-brand-500 text-[#07110d]'
                  : future
                    ? 'bg-line/30 text-muted'
                    : isToday
                      ? 'bg-brand-50 text-brand-500 ring-2 ring-brand-500/70 hover:bg-brand-100'
                      : 'bg-line/50 text-ink hover:bg-brand-200'
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        {habit.done}/{habit.target}
        <span className="ml-2 font-medium text-brand-500">{percent}%</span>
      </p>
    </article>
  );
}
