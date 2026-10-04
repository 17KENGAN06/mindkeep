import { useTranslation } from 'react-i18next';
import { SnapReveal } from '@/components/home/SnapReveal';
import { SiteFooter } from '@/components/layout/SiteFooter';

export function HomeFooter() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col justify-center overflow-y-auto px-4 py-4 sm:px-6 sm:py-8 lg:px-8 xl:pr-28">
      <SnapReveal direction="left">
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('home.sections.footer')}
        </p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:mt-3 sm:text-4xl xl:text-[2.75rem] xl:leading-tight">
          {t('footer.tagline')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          {t('footer.about')}
        </p>
      </SnapReveal>

      <SnapReveal delay={0.1} className="mt-8 min-h-0 sm:mt-10">
        <SiteFooter screen />
      </SnapReveal>
    </div>
  );
}
