import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { parseTaskImport } from '@/features/tasks/parseTaskImport';

type PairChoice = 'tab' | 'comma' | 'custom';
type CardChoice = 'newline' | 'semicolon' | 'custom';

type TaskImportDialogProps = {
  open: boolean;
  date: string;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onImport: (tasks: { title: string; minutes: number }[]) => void;
};

function SepChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-10 whitespace-nowrap rounded-full px-3 text-sm font-medium transition touch-manipulation ${
        selected ? 'bg-brand-500 text-[#07110d]' : 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function TaskImportDialog({
  open,
  date,
  isLoading = false,
  error,
  onClose,
  onImport,
}: TaskImportDialogProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [pairChoice, setPairChoice] = useState<PairChoice>('tab');
  const [cardChoice, setCardChoice] = useState<CardChoice>('newline');
  const [pairCustom, setPairCustom] = useState('');
  const [cardCustom, setCardCustom] = useState('');

  // Start fresh each time the dialog opens (adjusted during render).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText('');
      setPairChoice('tab');
      setCardChoice('newline');
      setPairCustom('');
      setCardCustom('');
    }
  }

  const pairSep = pairChoice === 'tab' ? '\t' : pairChoice === 'comma' ? ',' : pairCustom;
  const cardSep = cardChoice === 'newline' ? '\n' : cardChoice === 'semicolon' ? ';' : cardCustom;
  const parsed = useMemo(() => parseTaskImport(text, pairSep, cardSep), [text, pairSep, cardSep]);

  useLockBodyScroll(open);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 overscroll-none sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-import-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (parsed.rows.length === 0) return;
          onImport(parsed.rows);
        }}
      >
        <div className="shrink-0">
          <h2 id="task-import-title" className="text-lg font-semibold text-ink">
            {t('tasks.importTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('tasks.importHint', { date })}</p>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
          <Textarea
            id="task-import-paste"
            label={t('tasks.importPaste')}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'English\t30\nMath\t45'}
            className="min-h-36 font-mono text-[13px]"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">{t('tasks.importPairSep')}</p>
              <div className="flex flex-wrap gap-2">
                <SepChip
                  selected={pairChoice === 'tab'}
                  label={t('tasks.importTab')}
                  onClick={() => setPairChoice('tab')}
                />
                <SepChip
                  selected={pairChoice === 'comma'}
                  label={t('tasks.importComma')}
                  onClick={() => setPairChoice('comma')}
                />
                <SepChip
                  selected={pairChoice === 'custom'}
                  label={t('tasks.importCustom')}
                  onClick={() => setPairChoice('custom')}
                />
              </div>
              {pairChoice === 'custom' ? (
                <Input
                  label={t('tasks.importCustom')}
                  value={pairCustom}
                  onChange={(event) => setPairCustom(event.target.value)}
                  autoComplete="off"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">{t('tasks.importCardSep')}</p>
              <div className="flex flex-wrap gap-2">
                <SepChip
                  selected={cardChoice === 'newline'}
                  label={t('tasks.importNewline')}
                  onClick={() => setCardChoice('newline')}
                />
                <SepChip
                  selected={cardChoice === 'semicolon'}
                  label={t('tasks.importSemicolon')}
                  onClick={() => setCardChoice('semicolon')}
                />
                <SepChip
                  selected={cardChoice === 'custom'}
                  label={t('tasks.importCustom')}
                  onClick={() => setCardChoice('custom')}
                />
              </div>
              {cardChoice === 'custom' ? (
                <Input
                  label={t('tasks.importCustom')}
                  value={cardCustom}
                  onChange={(event) => setCardCustom(event.target.value)}
                  autoComplete="off"
                />
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink">
              {t('tasks.importPreview', { count: parsed.rows.length })}
            </p>
            {parsed.rows.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t('tasks.importEmptyPreview')}</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-brand-50/40 p-3 ring-1 ring-line">
                {parsed.rows.map((row, index) => (
                  <li key={`${row.title}-${index}`} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink">{row.title}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {row.minutes} {t('tasks.minShort')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ErrorMessage message={error ?? undefined} />
        </div>

        <div className="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={parsed.rows.length === 0}>
            {t('tasks.importSubmit')}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
