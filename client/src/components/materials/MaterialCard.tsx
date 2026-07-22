import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { AppLanguage } from '@/i18n';
import type { Material } from '@/types/material';
import { formatDate } from '@/utils/date';

type MaterialCardProps = {
  material: Material;
};

export function MaterialCard({ material }: MaterialCardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;

  return (
    <Link
      to={`/materials/${material.id}`}
      className="block rounded-2xl bg-panel px-4 py-4 no-underline shadow-sm ring-1 ring-line transition hover:ring-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{material.title}</h2>
          {material.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{material.description}</p>
          ) : null}
        </div>
        <Badge tone={material.status === 'ARCHIVED' ? 'neutral' : 'success'}>
          {t(`materials.status.${material.status}`)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {material.category ? <span>{material.category.name}</span> : null}
        <span>
          {t('materials.learnedAt')}: {formatDate(material.learnedAt, language)}
        </span>
        <span>
          {t('materials.nextReview')}:{' '}
          {material.nextReviewAt ? formatDate(material.nextReviewAt, language) : '—'}
        </span>
      </div>
    </Link>
  );
}
