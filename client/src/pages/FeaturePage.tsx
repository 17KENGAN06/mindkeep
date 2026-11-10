import {
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';
import { featureSlugs, isFeatureSlug, type FeatureSlug } from '@/content/features';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { listFaq } from '@/seo/meta';
import { useLocalePath } from '@/seo/useLocalePath';

const ICONS: Record<FeatureSlug, LucideIcon> = {
  'spaced-repetition': GraduationCap,
  'calorie-tracker': Utensils,
  'budget-tracker': Wallet,
  'daily-planner': CalendarCheck,
};

type Point = { title: string; text: string };

/** A landing page for one feature (`/features/<slug>`), written for search and new visitors. */
export function FeaturePage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { localize } = useLocalePath();

  if (!isFeatureSlug(slug)) return <NotFoundPage />;

  const base = `landing.pages.${slug}`;
  const list = (key: string) => t(`${base}.${key}`, { returnObjects: true }) as unknown;
  const points = (Array.isArray(list('points')) ? list('points') : []) as Point[];
  const steps = (Array.isArray(list('steps')) ? list('steps') : []) as string[];
  const faq = listFaq(list('faq'));
  const Icon = ICONS[slug];

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-12 max-w-3xl sm:mt-16">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/25">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-5 text-[11px] tracking-[0.2em] text-brand-500 uppercase">{t(`${base}.eyebrow`)}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">{t(`${base}.title`)}</h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t(`${base}.lead`)}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-on-brand no-underline transition hover:bg-brand-400"
            >
              {t('landing.start')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={localize('/plans')}
              className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold text-ink no-underline ring-1 ring-line transition hover:ring-brand-400"
            >
              {t('landing.plans')}
            </Link>
          </div>
        </Reveal>

        <section className="mt-16 sm:mt-20" aria-labelledby="feature-points">
          <h2 id="feature-points" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('landing.pointsTitle')}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {points.map((point, index) => (
              <Reveal key={point.title} delayMs={60 + index * 40}>
                <div className="h-full rounded-2xl bg-panel p-5 ring-1 ring-line sm:p-6">
                  <h3 className="text-base font-semibold text-ink">{point.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{point.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="feature-steps">
          <h2 id="feature-steps" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('landing.stepsTitle')}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl bg-panel p-5 ring-1 ring-line">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-on-brand tabular-nums">
                  {index + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-ink/90">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted">{t(`${base}.plan`)}</p>
        </section>

        {faq.length > 0 ? (
          <section className="mt-16 max-w-3xl" aria-labelledby="feature-faq">
            <h2 id="feature-faq" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {t('blog.faqTitle')}
            </h2>
            <div className="mt-5 divide-y divide-line rounded-2xl bg-panel ring-1 ring-line">
              {faq.map((item) => (
                <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
                    {item.q}
                    <span className="text-xl leading-none text-brand-500 transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16" aria-labelledby="feature-more">
          <h2 id="feature-more" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {t('landing.moreTitle')}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {featureSlugs
              .filter((other) => other !== slug)
              .map((other) => {
                const OtherIcon = ICONS[other];
                return (
                  <Link
                    key={other}
                    to={localize(`/features/${other}`)}
                    className="group flex items-center gap-3 rounded-2xl bg-panel p-4 text-ink no-underline ring-1 ring-line transition hover:ring-brand-400"
                  >
                    <OtherIcon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
                    <span className="text-sm font-semibold">{t(`landing.pages.${other}.nav`)}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted transition group-hover:text-brand-500" aria-hidden />
                  </Link>
                );
              })}
          </div>
        </section>

        <SiteFooter embedded />
      </div>
    </div>
  );
}
