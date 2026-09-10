import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormattedText } from '@/components/ui/FormattedText';

type AnswerRevealProps = {
  question: string;
  answer: string;
};

export function AnswerReveal({ question, answer }: AnswerRevealProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-brand-50/40 px-4 py-4 ring-1 ring-line/70">
        <p className="text-xs font-semibold tracking-wide text-brand-500 uppercase">
          {t('materials.fields.question')}
        </p>
        <div className="mt-2 text-base font-medium text-ink">
          <FormattedText text={question} className="!text-base !text-ink" />
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-panel px-4 py-4 text-left ring-1 ring-line transition hover:ring-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t('materials.fields.answer')}
          </p>
          <p className="mt-1 text-sm font-medium text-ink">
            {open ? t('materials.hideAnswer') : t('materials.revealAnswer')}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="rounded-2xl bg-brand-50/30 px-4 py-4 ring-1 ring-line/70">
          <FormattedText text={answer} className="!text-ink" />
        </div>
      ) : null}
    </div>
  );
}
