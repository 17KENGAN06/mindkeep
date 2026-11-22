import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppDownload } from '@/components/app/AppDownload';
import { PhonePreview } from '@/components/app/PhonePreview';
import { SnapReveal } from '@/components/home/SnapReveal';
import { HOME_SNAP_SHELL } from '@/config/layout';
import { useLocalePath } from '@/seo/useLocalePath';

/** Home screen about the Android app. */
export function HomeApp() {
  const { t } = useTranslation();
  const { localize } = useLocalePath();

  return (
    <div className={HOME_SNAP_SHELL}>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <div className="min-w-0">
          <SnapReveal direction="left">
            <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">{t('app.eyebrow')}</p>
            <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-balance text-ink sm:mt-3 sm:text-[1.85rem] lg:text-3xl xl:text-5xl xl:leading-[1.12]">
              {t('app.title')}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:mt-4 sm:text-base xl:text-lg">
              {t('app.subtitle')}
            </p>
          </SnapReveal>
          <SnapReveal delay={0.12} className="mt-7 xl:mt-9">
            <AppDownload placement="home" />
          </SnapReveal>
          <SnapReveal delay={0.2} className="mt-5">
            <Link
              to={localize('/app')}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-500 no-underline transition hover:text-brand-400"
            >
              {t('app.more')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </SnapReveal>
        </div>
        <SnapReveal direction="scale" delay={0.1} className="flex justify-center pb-4">
          <PhonePreview />
        </SnapReveal>
      </div>
    </div>
  );
}
