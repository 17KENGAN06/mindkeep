import { useTranslation } from 'react-i18next';
import { AppQr } from '@/components/app/AppQr';
import { GooglePlayBadge } from '@/components/app/GooglePlayBadge';
import type { StorePlacement } from '@/config/mobileApp';

/** Store badge; with a QR code beside it where the visitor is on a computer. */
export function AppDownload({ placement }: { placement: StorePlacement }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
      <div className="hidden items-center gap-4 rounded-3xl bg-panel p-3 pr-6 ring-1 ring-line lg:flex">
        <AppQr className="w-32" />
        <div>
          <p className="max-w-[13rem] text-sm leading-relaxed text-ink">{t('app.qrHint')}</p>
          <p className="mt-1.5 text-sm font-semibold text-brand-500">mindkeep.cloud/app</p>
        </div>
      </div>
      <div className="w-full sm:w-auto">
        <GooglePlayBadge placement={placement} className="w-52" />
        <p className="mt-2.5 text-xs text-muted">{t('app.free')}</p>
      </div>
    </div>
  );
}
