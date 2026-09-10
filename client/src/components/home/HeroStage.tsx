import { motion, useReducedMotion } from 'motion/react';
import { CheckSquare, GraduationCap, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Desktop hero visual plane — product atmosphere for the first viewport. */
export function HeroStage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto hidden h-full min-h-[30rem] w-full max-w-xl lg:block">
      <div
        aria-hidden
        className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,var(--app-accent-soft),transparent_55%),linear-gradient(160deg,var(--app-brand-50),transparent_70%)]"
      />
      <div aria-hidden className="absolute -inset-6 rounded-[3rem] bg-brand-500/10 blur-3xl" />

      <motion.div
        className="absolute top-[8%] left-[6%] z-20 w-[72%] rounded-[1.5rem] border border-line/80 bg-panel/90 p-4 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: -2 }}
        animate={
          reduceMotion
            ? { opacity: 1, y: 0, rotate: -2 }
            : { opacity: 1, y: [0, -8, 0], rotate: -2 }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : {
                opacity: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 },
                rotate: { duration: 0.7, delay: 0.2 },
              }
        }
      >
        <div className="flex items-center gap-2 text-brand-500">
          <CheckSquare className="h-4 w-4" aria-hidden />
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">
            {t('home.heroVisual.tasksTitle')}
          </p>
        </div>
        <ul className="mt-3 space-y-2.5">
          {[t('home.heroVisual.tasksItem1'), t('home.heroVisual.tasksItem2')].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-ink">
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-brand-500/50 bg-brand-500/15" />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="absolute top-[38%] right-[2%] z-30 w-[68%] rounded-[1.5rem] border border-line/80 bg-panel/95 p-4 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, y: 32, rotate: 3 }}
        animate={
          reduceMotion
            ? { opacity: 1, y: 0, rotate: 3 }
            : { opacity: 1, y: [0, 10, 0], rotate: 3 }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : {
                opacity: { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 1.1 },
                rotate: { duration: 0.7, delay: 0.35 },
              }
        }
      >
        <div className="flex items-center gap-2 text-brand-500">
          <GraduationCap className="h-4 w-4" aria-hidden />
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">
            {t('home.heroVisual.reviewTitle')}
          </p>
        </div>
        <p className="mt-3 text-sm font-medium text-ink">{t('home.heroVisual.reviewQuestion')}</p>
        <div className="mt-3 rounded-xl border border-dashed border-brand-500/40 bg-brand-50/40 px-3 py-2 text-xs text-muted">
          {t('home.heroVisual.reviewHint')}
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[6%] left-[14%] z-10 w-[62%] rounded-[1.5rem] border border-line/80 bg-panel/90 p-4 shadow-[0_18px_50px_-26px_rgba(0,0,0,0.5)] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: -1.5 }}
        animate={
          reduceMotion
            ? { opacity: 1, y: 0, rotate: -1.5 }
            : { opacity: 1, y: [0, -6, 0], rotate: -1.5 }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : {
                opacity: { duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.3 },
                rotate: { duration: 0.7, delay: 0.5 },
              }
        }
      >
        <div className="flex items-center gap-2 text-brand-500">
          <Wallet className="h-4 w-4" aria-hidden />
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">
            {t('home.heroVisual.financeTitle')}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted">{t('home.heroVisual.financeLabel')}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">
          {t('home.heroVisual.financeValue')}
        </p>
      </motion.div>
    </div>
  );
}
