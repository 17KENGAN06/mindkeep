import { useTranslation } from 'react-i18next';
import { googlePlayUrl, type StorePlacement } from '@/config/mobileApp';
import { useLocalePath } from '@/seo/useLocalePath';

type GooglePlayBadgeProps = {
  placement: StorePlacement;
  /** Width of the visible badge. */
  className?: string;
};

/** Official Google Play badge as a link. The PNG has a transparent margin, cropped here. */
export function GooglePlayBadge({ placement, className = 'w-44' }: GooglePlayBadgeProps) {
  const { t } = useTranslation();
  const { lang } = useLocalePath();

  return (
    <a
      href={googlePlayUrl(placement, lang)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('app.getOnPlay')}
      className={`relative block aspect-[564/168] shrink-0 overflow-hidden rounded-[0.5rem] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_var(--app-accent)] focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none ${className}`}
    >
      <img
        src="/badges/google-play.png"
        alt=""
        width={646}
        height={250}
        className="absolute w-[114.54%] max-w-none select-none"
        style={{ left: '-7.27%', top: '-24.4%' }}
        draggable={false}
      />
    </a>
  );
}
