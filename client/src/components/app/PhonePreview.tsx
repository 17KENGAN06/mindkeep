import { Check, CheckSquare, Flame, GraduationCap, House, Layers, Plus, Utensils, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

const RINGS = [
  { icon: CheckSquare, value: 0.72 },
  { icon: GraduationCap, value: 0.5 },
  { icon: Flame, value: 0.9 },
  { icon: Utensils, value: 0.38 },
] as const;

const card = 'rounded-[1.1rem] border border-line bg-panel p-3';
const cardTitle = 'flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-brand-500 uppercase';

/** The app's Home screen in a phone, drawn in the site's theme and language. Decorative. */
export function PhonePreview({ className = '' }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div aria-hidden className={`relative w-[17.5rem] select-none ${className}`}>
      <div className="pointer-events-none absolute -inset-16 -z-10 rounded-full bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_68%)]" />
      <div className="rounded-[2.6rem] bg-[#171c20] p-[7px] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/15">
        <div className="relative flex h-[34.5rem] flex-col overflow-hidden rounded-[2.2rem] bg-surface">
          <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-semibold text-ink">
            <span>9:41</span>
            <span className="h-2.5 w-5 rounded-[3px] border border-ink/60 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-ink/80" />
            </span>
          </div>
          <span className="absolute top-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          <div className="flex items-center gap-2.5 px-4 pt-4">
            <BrandMark className="h-9 w-9 shrink-0" title="" />
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-semibold text-ink">MindKeep</p>
              <p className="truncate text-[11px] text-muted">{t('nav.dashboard')}</p>
            </div>
          </div>

          <div className="space-y-2.5 px-4 pt-3.5">
            <div className={`${card} flex justify-between px-4`}>
              {RINGS.map(({ icon: Icon, value }) => (
                <span key={value} className="relative flex h-11 w-11 items-center justify-center text-brand-500">
                  <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                    <circle cx="22" cy="22" r="19" fill="none" strokeWidth="3.5" className="stroke-brand-100" />
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={`${value} 1`}
                      className="stroke-brand-500"
                    />
                  </svg>
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>

            <div className={card}>
              <p className={cardTitle}>
                <CheckSquare className="h-3.5 w-3.5" />
                {t('home.heroVisual.tasksTitle')}
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-ink">
                <li className="flex items-center gap-2 text-muted line-through">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-brand-500 text-on-brand">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="truncate">{t('home.heroVisual.tasksItem1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-4 w-4 shrink-0 rounded-[5px] border border-brand-500/50" />
                  <span className="truncate">{t('home.heroVisual.tasksItem2')}</span>
                </li>
              </ul>
            </div>

            <div className={card}>
              <p className={cardTitle}>
                <GraduationCap className="h-3.5 w-3.5" />
                {t('home.heroVisual.reviewTitle')}
              </p>
              <p className="mt-2 truncate text-xs font-medium text-ink">{t('home.heroVisual.reviewQuestion')}</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold">
                {[3, 7, 30].map((day, index) => (
                  <span
                    key={day}
                    className={`rounded-lg py-1 ${index === 0 ? 'bg-brand-500 text-on-brand' : 'bg-brand-100 text-muted'}`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className={`${card} flex items-end justify-between gap-2`}>
              <div className="min-w-0">
                <p className={cardTitle}>
                  <Wallet className="h-3.5 w-3.5" />
                  {t('home.heroVisual.financeTitle')}
                </p>
                <p className="mt-1.5 truncate text-[11px] text-muted">{t('home.heroVisual.financeLabel')}</p>
              </div>
              <p className="font-display text-lg leading-none font-semibold text-ink">
                {t('home.heroVisual.financeValue')}
              </p>
            </div>
          </div>

          <div className="mt-auto px-4 pb-3">
            <div className="flex items-center justify-around rounded-full border border-line bg-panel py-2">
              <House className="h-5 w-5 text-brand-500" />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-on-brand shadow-[0_10px_26px_-10px_var(--app-accent)]">
                <Plus className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <Layers className="h-5 w-5 text-muted" />
            </div>
            <span className="mx-auto mt-2.5 block h-1 w-24 rounded-full bg-ink/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
