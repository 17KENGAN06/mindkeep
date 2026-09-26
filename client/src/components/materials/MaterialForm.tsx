import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MaterialContentEditor } from '@/components/materials/MaterialContentEditor';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createMaterialFormSchema, type MaterialFormValues } from '@/schemas/material';
import type { Category } from '@/types/category';
import type { Material } from '@/types/material';
import { dateInputToIso, toDateInputValue } from '@/utils/date';

type MaterialFormProps = {
  categories: Category[];
  initialMaterial?: Material;
  submitLabel: string;
  errorMessage?: string;
  isSubmitting?: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    content: string;
    question: string | null;
    answer: string | null;
    sourceUrl: string | null;
    learnedAt: string;
    categoryId: string | null;
  }) => Promise<void>;
};

function toFormValues(material?: Material): MaterialFormValues {
  return {
    title: material?.title ?? '',
    content: material?.content ?? '',
    sourceUrl: material?.sourceUrl ?? '',
    learnedAt: toDateInputValue(material?.learnedAt),
    categoryId: material?.categoryId ?? '',
  };
}

export function MaterialForm({
  categories,
  initialMaterial,
  submitLabel,
  errorMessage,
  isSubmitting = false,
  onSubmit,
}: MaterialFormProps) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(createMaterialFormSchema(t)),
    defaultValues: toFormValues(initialMaterial),
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      description: '',
      content: values.content ?? '',
      question: initialMaterial ? initialMaterial.question : null,
      answer: initialMaterial ? initialMaterial.answer : null,
      sourceUrl: values.sourceUrl?.trim() ? values.sourceUrl.trim() : null,
      learnedAt: dateInputToIso(values.learnedAt),
      categoryId: values.categoryId ? values.categoryId : null,
    });
  });

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Input label={t('materials.fields.title')} error={errors.title?.message} {...register('title')} />
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <MaterialContentEditor
            value={field.value ?? ''}
            onChange={field.onChange}
            label={t('materials.fields.content')}
            error={errors.content?.message}
          />
        )}
      />
      <Input
        label={t('materials.fields.sourceUrl')}
        type="url"
        error={errors.sourceUrl?.message}
        {...register('sourceUrl')}
      />
      <Input
        label={t('materials.fields.learnedAt')}
        type="date"
        error={errors.learnedAt?.message}
        {...register('learnedAt')}
      />
      <Select
        label={t('materials.fields.category')}
        placeholder={t('materials.fields.noCategory')}
        options={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
        error={errors.categoryId?.message}
        {...register('categoryId')}
      />

      <ErrorMessage message={errorMessage} />

      <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
