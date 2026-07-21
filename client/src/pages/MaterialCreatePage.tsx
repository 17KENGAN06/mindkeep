import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MaterialForm } from '@/components/materials/MaterialForm';
import { Button } from '@/components/ui/Button';
import { useCategories } from '@/features/categories/useCategories';
import { useCreateMaterial } from '@/features/materials/useMaterials';

export function MaterialCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const createMaterial = useCreateMaterial();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('materials.createTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('materials.createSubtitle')}</p>
        </div>
        <Link to="/materials">
          <Button variant="secondary">{t('common.back')}</Button>
        </Link>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <MaterialForm
          categories={categories}
          submitLabel={t('materials.create')}
          isSubmitting={createMaterial.isPending}
          errorMessage={errorMessage}
          onSubmit={async (payload) => {
            setErrorMessage(undefined);
            try {
              const result = await createMaterial.mutateAsync(payload);
              void navigate(`/materials/${result.material.id}`);
            } catch {
              setErrorMessage(t('auth.errors.generic'));
            }
          }}
        />
      </section>
    </div>
  );
}
