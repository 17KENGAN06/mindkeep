import { BellRing, Camera, Plus, RefreshCw, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppDownload } from '@/components/app/AppDownload';
import { PhonePreview } from '@/components/app/PhonePreview';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';

const POINTS: { key: string; icon: LucideIcon }[] = [
  { key: 'sync', icon: RefreshCw },
  { key: 'add', icon: Plus },
  { key: 'reminders', icon: BellRing },
  { key: 'scan', icon: Camera },
];

const STEPS = ['install', 'signIn', 'choose'] as const;

/** The Android app (`/app`): the address for social bios and the QR code. */
export function AppPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <div className="mt-8 grid items-center gap-12 sm:mt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:mt-16">
          <Reveal trigger="mount" className="min-w-0">
            <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">{t('app.eyebrow')}</p>
            <h1 className="font-display mt-3 max-w-[18ch] text-[2.1rem] leading-[1.1] font-semibold tracking-tight text-balance text-ink sm:text-5xl xl:text-6xl">
              {t('app.title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t('app.subtitle')}</p>
            <div className="mt-7 sm:mt-9">
              <AppDownload placement="app" />
            </div>
            <p className="mt-5 text-sm text-muted">{t('app.iphone')}</p>
          </Reveal>
          <Reveal trigger="mount" direction="scale" delayMs={120} className="flex justify-center">
            <PhonePreview />
          </Reveal>
        </div>

        <section className="mt-16 sm:mt-24" aria-labelledby="app-points">
          <h2 id="app-points" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('app.pointsTitle')}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {POINTS.map(({ key, icon: Icon }, index) => (
              <Reveal key={key} delayMs={60 + index * 40} className="h-full">
                <div className="h-full rounded-2xl bg-panel p-5 ring-1 ring-line sm:p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/25">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">{t(`app.points.${key}.title`)}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{t(`app.points.${key}.text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-16 mb-16" aria-labelledby="app-steps">
          <h2 id="app-steps" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('app.stepsTitle')}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl bg-panel p-5 ring-1 ring-line">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-on-brand tabular-nums">
                  {index + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-ink/90">{t(`app.steps.${step}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <SiteFooter embedded />
      </div>
    </div>
  );
}
