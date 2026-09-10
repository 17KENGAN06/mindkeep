import { ChevronDown, ChevronUp, X } from 'lucide-react';
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

  const close = () => setOpen(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="pointer-events-auto mx-auto flex w-full max-w-lg items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex w-full items-center gap-1.5 rounded-2xl border border-line/80 bg-panel/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <button
              type="button"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-ink transition enabled:active:bg-brand-50 disabled:opacity-35"
              aria-label={t('home.mobileNav.prev')}
              disabled={!canPrev}
              onClick={goPrev}
            >
              <ChevronUp className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              className="group flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-ink ring-1 ring-brand-500/35 transition active:bg-brand-50"
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls={titleId}
              onClick={() => setOpen(true)}
            >
              <span className="flex max-w-full items-center gap-1.5">
                <span className="truncate text-sm font-semibold">{activeLabel}</span>
                <ChevronUp
                  className="h-3.5 w-3.5 shrink-0 text-brand-500 transition group-active:-translate-y-0.5"
                  aria-hidden
                />
              </span>
              <span className="text-[10px] font-medium tracking-[0.14em] text-brand-500 uppercase">
                {t('home.mobileNav.openHint')}
              </span>
            </button>

            <button
              type="button"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-ink transition enabled:active:bg-brand-50 disabled:opacity-35"
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
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-panel md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
                {t('home.mobileNav.sections')}
              </p>
              <h2 id={titleId} className="font-display truncate text-xl font-semibold text-ink">
                {t('home.mobileNav.title')}
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-2xl border border-line bg-brand-50/50 px-3 text-sm font-semibold text-ink transition active:bg-brand-50"
              aria-label={t('nav.closeMenu')}
              onClick={close}
            >
              <X className="h-5 w-5" aria-hidden />
              <span>{t('home.mobileNav.close')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <ul className="space-y-2">
              {sectionIds.map((id, index) => {
                const active = id === activeId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-base font-semibold transition ${
                        active
                          ? 'bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/40'
                          : 'bg-brand-50/30 text-ink ring-1 ring-line/70 active:bg-brand-50'
                      }`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        onSelect(id);
                        close();
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

            <p className="mt-6 mb-3 text-xs tracking-[0.18em] text-muted uppercase">
              {t('home.mobileNav.pages')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/guide"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                onClick={close}
              >
                {t('nav.guide')}
              </Link>
              <Link
                to="/blog"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                onClick={close}
              >
                {t('nav.blog')}
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="col-span-2 inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline"
                  onClick={close}
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70"
                    onClick={close}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline"
                    onClick={close}
                  >
                    {t('home.ctaRegister')}
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl border border-line text-sm font-semibold text-muted transition active:bg-brand-50 active:text-ink"
              onClick={close}
            >
              {t('home.mobileNav.closeFull')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
