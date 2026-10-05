import { useTranslation } from 'react-i18next';
import { SnapReveal } from '@/components/home/SnapReveal';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HOME_SNAP_SHELL } from '@/config/layout';

export function HomeFooter() {
  const { t } = useTranslation();

  return (
    <div className={HOME_SNAP_SHELL}>
      <SnapReveal direction="left">
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('home.sections.footer')}
        </p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:mt-3 sm:text-[1.85rem] lg:text-3xl xl:text-[2.75rem] xl:leading-tight">
          {t('home.footerTitle')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          {t('home.footerLead')}
        </p>
      </SnapReveal>

      <SnapReveal delay={0.1} className="mt-8 min-h-0 sm:mt-10">
        <SiteFooter screen />
      </SnapReveal>
    </div>
  );
}
