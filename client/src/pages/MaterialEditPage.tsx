import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MaterialForm } from '@/components/materials/MaterialForm';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useCategories } from '@/features/categories/useCategories';
import { useMaterial, useUpdateMaterial } from '@/features/materials/useMaterials';

export function MaterialEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: material, isLoading, isError } = useMaterial(id);
  const { data: categories = [] } = useCategories();
  const updateMaterial = useUpdateMaterial();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  if (isLoading) return <Loader />;
  if (isError || !material) return <ErrorMessage message={t('auth.errors.generic')} />;

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('materials.editTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{material.title}</p>
        </div>
        <Link to={`/materials/${material.id}`}>
          <Button variant="secondary">{t('common.back')}</Button>
        </Link>
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <MaterialForm
          categories={categories}
          initialMaterial={material}
          submitLabel={t('common.save')}
          isSubmitting={updateMaterial.isPending}
          errorMessage={errorMessage}
          onSubmit={async (payload) => {
            setErrorMessage(undefined);
            try {
              await updateMaterial.mutateAsync({ id: material.id, payload });
              void navigate(`/materials/${material.id}`);
            } catch {
              setErrorMessage(t('auth.errors.generic'));
            }
          }}
        />
      </section>
    </div>
  );
}
