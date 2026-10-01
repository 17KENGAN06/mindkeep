import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type AppLanguage } from '@/i18n';

type LanguageSwitcherProps = {
  variant?: 'compact' | 'panel';
};

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const currentLabel =
    supportedLanguages.find((language) => language.code === current)?.label ?? current;

  if (variant === 'panel') {
    return (
      <div
        role="listbox"
        aria-label={t('common.language')}
        className="grid grid-cols-2 gap-1 rounded-2xl bg-brand-50/40 p-1.5 ring-1 ring-line/70"
      >
        {supportedLanguages.map((language) => {
          const active = language.code === current;
          return (
            <button
              key={language.code}
              type="button"
              role="option"
              aria-selected={active}
              className={`min-h-10 rounded-xl px-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                active
                  ? 'bg-brand-500 text-[#07110d] shadow-sm'
                  : 'text-muted hover:bg-panel hover:text-ink'
              }`}
              onClick={() => void i18n.changeLanguage(language.code)}
            >
              {language.label}
            </button>
          );
        })}
      </div>
    );
  }

  return <CompactLanguageMenu current={current} currentLabel={currentLabel} />;
}

function CompactLanguageMenu({
  current,
  currentLabel,
}: {
  current: AppLanguage;
  currentLabel: string;
}) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-panel px-2.5 text-sm font-semibold text-ink transition hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-label={t('common.language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages className="h-4 w-4 text-brand-500" aria-hidden />
        <span className="hidden max-w-[7rem] truncate min-[420px]:inline">{currentLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 z-[80] mt-2 max-h-[min(20rem,calc(100dvh-5.5rem))] w-[min(16.5rem,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-2xl bg-panel p-1.5 shadow-lg ring-1 ring-line"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full bg-brand-500/15 blur-2xl"
          />
          <div className="relative grid gap-0.5">
            {supportedLanguages.map((language) => {
              const active = language.code === current;
              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    active
                      ? 'bg-brand-500 text-[#07110d] shadow-sm'
                      : 'text-ink hover:bg-brand-50'
                  }`}
                  onClick={() => {
                    void i18n.changeLanguage(language.code);
                    setOpen(false);
                  }}
                >
                  <span>{language.label}</span>
                  {active ? <Check className="h-4 w-4" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
