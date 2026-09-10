import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

type BrandLockupProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: { mark: 'h-7 w-7 shrink-0', text: 'text-base' },
  md: { mark: 'h-8 w-8 shrink-0', text: 'text-lg' },
  lg: { mark: 'h-9 w-9 shrink-0 sm:h-10 sm:w-10', text: 'text-lg sm:text-xl md:text-2xl' },
} as const;

export function BrandLockup({ to = '/', size = 'md', className = '' }: BrandLockupProps) {
  const { t } = useTranslation();
  const sizes = sizeMap[size];

  const content = (
    <>
      <BrandMark className={sizes.mark} title={t('common.appName')} />
      <span
        className={`min-w-0 truncate font-display font-semibold tracking-tight text-ink ${sizes.text}`}
      >
        {t('common.appName')}
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`inline-flex min-w-0 items-center gap-2 no-underline sm:gap-2.5 ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`inline-flex min-w-0 items-center gap-2 sm:gap-2.5 ${className}`}>
      {content}
    </div>
  );
}
