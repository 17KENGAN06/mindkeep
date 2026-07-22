import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

type BrandLockupProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: { mark: 'h-7 w-7', text: 'text-base' },
  md: { mark: 'h-8 w-8', text: 'text-lg' },
  lg: { mark: 'h-10 w-10', text: 'text-xl sm:text-2xl' },
} as const;

export function BrandLockup({ to = '/', size = 'md', className = '' }: BrandLockupProps) {
  const { t } = useTranslation();
  const sizes = sizeMap[size];

  const content = (
    <>
      <BrandMark className={sizes.mark} title={t('common.appName')} />
      <span className={`font-display font-semibold tracking-tight text-ink ${sizes.text}`}>
        {t('common.appName')}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center gap-2.5 no-underline ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center gap-2.5 ${className}`}>{content}</div>;
}
