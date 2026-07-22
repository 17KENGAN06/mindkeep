import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type StoreComingSoonProps = {
  animated?: boolean;
};

export function StoreComingSoon({ animated = false }: StoreComingSoonProps) {
  const { t } = useTranslation();
  const reveal = (extra = '') => (animated ? `snap-reveal ${extra}` : '');

  return (
    <div className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
      <p className={`${reveal('snap-reveal-left')} font-display text-xs tracking-[0.24em] text-brand-500 uppercase`}>
        {t('home.apps.eyebrow')}
      </p>
      <h3
        className={`${reveal('snap-reveal-d1 snap-reveal-left')} font-display mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl`}
      >
        {t('home.apps.title')}
      </h3>
      <p
        className={`${reveal('snap-reveal-d2 snap-reveal-right')} mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base`}
      >
        {t('home.apps.subtitle')}
      </p>

      <div className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className={`${reveal('snap-reveal-d3 snap-pop')} relative inline-flex justify-center sm:justify-start`}>
          <img
            src="/badges/app-store.svg"
            alt="Download on the App Store"
            className="h-12 w-auto select-none sm:h-14"
            draggable={false}
          />
          <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#07110d] uppercase shadow-sm">
            {t('home.apps.badge')}
          </span>
        </div>
        <div className={`${reveal('snap-reveal-d4 snap-pop')} relative inline-flex justify-center sm:justify-start`}>
          <img
            src="/badges/google-play.png"
            alt="Get it on Google Play"
            className="h-16 w-auto select-none sm:h-[4.5rem]"
            draggable={false}
          />
          <span className="pointer-events-none absolute top-0 right-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#07110d] uppercase shadow-sm sm:right-4">
            {t('home.apps.badge')}
          </span>
        </div>
      </div>

      <p className={`${reveal('snap-reveal-d5')} mt-5 text-xs text-muted sm:text-sm`}>{t('home.apps.note')}</p>
      <Link
        to="/blog"
        className={`${reveal('snap-reveal-d6 snap-reveal-left')} mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline`}
      >
        {t('home.apps.readBlog')} →
      </Link>
    </div>
  );
}
