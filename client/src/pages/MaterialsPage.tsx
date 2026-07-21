import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { useCategories } from '@/features/categories/useCategories';
import { useMaterials } from '@/features/materials/useMaterials';
import type { MaterialStatus } from '@/types/material';

export function MaterialsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<MaterialStatus | ''>('ACTIVE');

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
    }),
    [categoryId, search, status],
  );

  const { data: materials, isLoading, isError } = useMaterials(query);
  const { data: categories = [] } = useCategories();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('materials.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('materials.subtitle')}</p>
        </div>
        <Link to="/materials/new">
          <Button>{t('materials.create')}</Button>
        </Link>
      </section>

      <section className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:grid-cols-3">
        <Input
          label={t('materials.filters.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label={t('materials.filters.category')}
          placeholder={t('materials.filters.allCategories')}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <Select
          label={t('materials.filters.status')}
          value={status}
          onChange={(event) => setStatus(event.target.value as MaterialStatus | '')}
          options={[
            { value: '', label: t('materials.filters.allStatuses') },
            { value: 'ACTIVE', label: t('materials.status.ACTIVE') },
            { value: 'ARCHIVED', label: t('materials.status.ARCHIVED') },
          ]}
        />
      </section>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorMessage message={t('auth.errors.generic')} /> : null}

      {!isLoading && !isError && materials && materials.length === 0 ? (
        <EmptyState
          title={t('materials.emptyTitle')}
          description={t('materials.emptyDescription')}
          action={
            <Link to="/materials/new">
              <Button>{t('materials.create')}</Button>
            </Link>
          }
        />
      ) : null}

      <div className="space-y-3">
        {materials?.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>
    </div>
  );
}
