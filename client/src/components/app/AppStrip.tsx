import { useTranslation } from 'react-i18next';
import { AppQr } from '@/components/app/AppQr';
import { GooglePlayBadge } from '@/components/app/GooglePlayBadge';
import { BrandMark } from '@/components/brand/BrandMark';
import type { StorePlacement } from '@/config/mobileApp';

type AppStripProps = {
  placement: StorePlacement;
  className?: string;
};

/** Compact "get the app" panel for the end of a page. */
export function AppStrip({ placement, className = '' }: AppStripProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('app.eyebrow')}
      className={`flex flex-col gap-5 rounded-3xl border border-line bg-panel/80 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${className}`}
    >
      <BrandMark className="h-14 w-14 shrink-0" title="" />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{t('app.stripTitle')}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{t('app.stripText')}</p>
      </div>
      <GooglePlayBadge placement={placement} className="w-44" />
      <AppQr className="hidden w-28 lg:block" />
    </section>
  );
}
