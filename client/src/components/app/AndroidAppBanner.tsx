import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';
import { env } from '@/config/env';
import { googlePlayUrl } from '@/config/mobileApp';
import { useLocalePath } from '@/seo/useLocalePath';

const DISMISSED_KEY = 'lr_app_banner';
const QUIET_DAYS = 30;

/** Pages with one job (or with their own store button), and returns from the app itself. */
const HIDDEN_ON = ['/app', '/billing/return', '/verify-email', '/reset-password', '/onboarding', '/delete-account'];

function shouldOffer(): boolean {
  if (!/android/i.test(navigator.userAgent)) return false;
  try {
    const dismissed = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    return Date.now() - dismissed > QUIET_DAYS * 86_400_000;
  } catch {
    return true;
  }
}

/** Offers the Google Play app to visitors in an Android browser. */
export function AndroidAppBanner() {
  const { t } = useTranslation();
  const { basePath, lang } = useLocalePath();
  const [open, setOpen] = useState(shouldOffer);

  if (!open || env.maintenanceMode || HIDDEN_ON.includes(basePath)) return null;

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Private mode: hidden until the next load.
    }
  };

  return (
    <aside
      aria-label={t('app.eyebrow')}
      className="relative z-[60] flex items-center gap-2.5 border-b border-line bg-panel pt-[max(0.5rem,env(safe-area-inset-top))] pr-3 pb-2 pl-1"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('app.bannerClose')}
        className="inline-flex h-11 w-9 shrink-0 items-center justify-center text-muted"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <BrandMark className="h-10 w-10 shrink-0" title="" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">MindKeep</p>
        <p className="text-xs leading-tight text-muted">{t('app.bannerText')}</p>
      </div>
      <a
        href={googlePlayUrl('banner', lang)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-on-brand no-underline"
      >
        {t('app.bannerCta')}
      </a>
    </aside>
  );
}
