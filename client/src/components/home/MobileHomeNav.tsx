import { ChevronDown, ChevronUp, List, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';

type MobileHomeNavProps = {
  sectionIds: string[];
  labels: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function MobileHomeNav({ sectionIds, labels, activeId, onSelect }: MobileHomeNavProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const activeIndex = Math.max(0, sectionIds.indexOf(activeId));
  const activeLabel = labels[activeIndex] ?? '';
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < sectionIds.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const goPrev = () => {
    if (!canPrev) return;
    const id = sectionIds[activeIndex - 1];
    if (id) onSelect(id);
  };

  const goNext = () => {
    if (!canNext) return;
    const id = sectionIds[activeIndex + 1];
    if (id) onSelect(id);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="pointer-events-auto mx-auto flex w-full max-w-lg items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex w-full items-center gap-1.5 rounded-2xl border border-line/80 bg-panel/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink transition enabled:hover:bg-brand-50 disabled:opacity-35"
              aria-label={t('home.mobileNav.prev')}
              disabled={!canPrev}
              onClick={goPrev}
            >
              <ChevronUp className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold text-ink transition hover:bg-brand-50"
              aria-expanded={open}
              aria-controls={titleId}
              onClick={() => setOpen(true)}
            >
              <List className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
              <span className="truncate">{activeLabel}</span>
            </button>

            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink transition enabled:hover:bg-brand-50 disabled:opacity-35"
              aria-label={t('home.mobileNav.next')}
              disabled={!canNext}
              onClick={goNext}
            >
              <ChevronDown className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[1.75rem] border border-line bg-panel px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                {t('home.mobileNav.title')}
              </h2>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-ink"
                aria-label={t('nav.closeMenu')}
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <p className="mb-3 text-xs tracking-[0.18em] text-muted uppercase">
              {t('home.mobileNav.sections')}
            </p>
            <ul className="space-y-1.5">
              {sectionIds.map((id, index) => {
                const active = id === activeId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition ${
                        active
                          ? 'bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/40'
                          : 'bg-brand-50/30 text-ink ring-1 ring-line/70 hover:bg-brand-50'
                      }`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        onSelect(id);
                        setOpen(false);
                      }}
                    >
                      <span>{labels[index]}</span>
                      <span className="font-display text-xs tracking-wide text-muted">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 mb-3 text-xs tracking-[0.18em] text-muted uppercase">
              {t('home.mobileNav.pages')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/guide"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                onClick={() => setOpen(false)}
              >
                {t('nav.guide')}
              </Link>
              <Link
                to="/blog"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                onClick={() => setOpen(false)}
              >
                {t('nav.blog')}
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline"
                  onClick={() => setOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline"
                    onClick={() => setOpen(false)}
                  >
                    {t('home.ctaRegister')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
