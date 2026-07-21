import { zodResolver } from '@hookform/resolvers/zod';
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
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/categories/useCategories';
import { createCategorySchema, type CategoryFormValues } from '@/schemas/category';
import type { Category } from '@/types/category';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories, isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema(t)),
    defaultValues: { name: '' },
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema(t)),
    values: { name: editing?.name ?? '' },
  });

  const onCreate = createForm.handleSubmit(async (values) => {
    setFormError(null);

    try {
      await createCategory.mutateAsync(values);
      createForm.reset({ name: '' });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CATEGORY_NAME_TAKEN') {
        setFormError(t('categories.errors.nameTaken'));
        return;
      }
      setFormError(t('auth.errors.generic'));
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!editing) return;
    setFormError(null);

    try {
      await updateCategory.mutateAsync({ id: editing.id, payload: values });
      setEditing(null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CATEGORY_NAME_TAKEN') {
        setFormError(t('categories.errors.nameTaken'));
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

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('categories.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('categories.subtitle')}</p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {editing ? t('categories.editTitle') : t('categories.createTitle')}
        </h2>

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={editing ? onUpdate : onCreate}
          noValidate
        >
          <div className="flex-1">
            <Input
              label={t('categories.name')}
              error={
                editing ? editForm.formState.errors.name?.message : createForm.formState.errors.name?.message
              }
              {...(editing ? editForm.register('name') : createForm.register('name'))}
            />
          </div>
          <div className="flex gap-2 pt-0 sm:pt-7">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setFormError(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" isLoading={updateCategory.isPending}>
                  {t('common.save')}
                </Button>
              </>
            ) : (
              <Button type="submit" isLoading={createCategory.isPending}>
                {t('categories.create')}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-3">
          <ErrorMessage message={formError ?? undefined} />
        </div>
      </section>

      <section className="space-y-3">
        {!categories || categories.length === 0 ? (
          <EmptyState
            title={t('categories.emptyTitle')}
            description={t('categories.emptyDescription')}
          />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-brand-100"
              >
                <div>
                  <p className="font-medium text-ink">{category.name}</p>
                  <p className="text-xs text-muted">
                    {t('categories.materialsCount', { count: category._count.materials })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t('categories.edit')}
                    onClick={() => {
                      setEditing(category);
                      setFormError(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t('categories.delete')}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('categories.deleteTitle')}
        description={t('categories.deleteDescription', { name: deleting?.name ?? '' })}
        confirmLabel={t('categories.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteCategory.isPending}
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
