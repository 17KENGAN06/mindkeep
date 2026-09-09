import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateFinanceCategory,
  useDeleteFinanceCategory,
  useFinanceCategories,
  useUpdateFinanceCategory,
} from '@/features/finance/useFinance';
import type { FinanceCategory } from '@/types/finance';

type CategoryFormValues = { name: string };

export function FinanceCategoriesPage() {
  const { t } = useTranslation();
  const { data: categories, isLoading, isError } = useFinanceCategories();
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const deleteCategory = useDeleteFinanceCategory();

  const [editing, setEditing] = useState<FinanceCategory | null>(null);
  const [deleting, setDeleting] = useState<FinanceCategory | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createForm = useForm<CategoryFormValues>({ defaultValues: { name: '' } });
  const editForm = useForm<CategoryFormValues>({
    values: { name: editing?.name ?? '' },
  });

  const onCreate = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createCategory.mutateAsync({ name: values.name.trim() });
      createForm.reset({ name: '' });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FINANCE_CATEGORY_NAME_TAKEN') {
        setFormError(t('finance.errors.categoryTaken'));
        return;
      }
      setFormError(t('auth.errors.generic'));
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!editing) return;
    setFormError(null);
    try {
      await updateCategory.mutateAsync({
        id: editing.id,
        payload: { name: values.name.trim() },
      });
      setEditing(null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FINANCE_CATEGORY_NAME_TAKEN') {
        setFormError(t('finance.errors.categoryTaken'));
        return;
      }
      setFormError(t('auth.errors.generic'));
    }
  });

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCategory.mutateAsync(deleting.id);
      setDeleting(null);
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <ErrorMessage message={t('auth.errors.generic')} />;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('finance.categoriesTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('finance.categoriesSubtitle')}</p>
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {editing ? t('finance.editCategory') : t('finance.createCategory')}
        </h2>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={editing ? onUpdate : onCreate}
          noValidate
        >
          <div className="flex-1">
            <Input
              label={t('finance.categoryName')}
              {...(editing ? editForm.register('name', { required: true }) : createForm.register('name', { required: true }))}
            />
          </div>
          <div className="flex gap-2 pt-0 sm:pt-7">
            {editing ? (
              <>
                <Button type="submit" isLoading={updateCategory.isPending}>
                  {t('common.save')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <Button type="submit" isLoading={createCategory.isPending}>
                {t('common.save')}
              </Button>
            )}
          </div>
        </form>
        <ErrorMessage message={formError ?? undefined} />
      </section>

      {!categories?.length ? (
        <EmptyState
          title={t('finance.emptyCategories')}
          description={t('finance.emptyCategoriesHint')}
        />
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-panel px-4 py-3 ring-1 ring-line"
            >
              <div>
                <p className="font-medium text-ink">{category.name}</p>
                <p className="text-xs text-muted">
                  {t('finance.operationsCount', { count: category._count?.operations ?? 0 })}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-ink"
                  aria-label={t('common.edit')}
                  onClick={() => setEditing(category)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-red-400"
                  aria-label={t('common.delete')}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('finance.deleteCategoryTitle')}
        description={t('finance.deleteCategoryDescription', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
