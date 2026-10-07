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
import type { MaterialPayload } from '@/api/materials';
import { useAccountToday } from '@/features/time/useAccountToday';
import { dateKeyInZone, zonedNoonIso } from '@/utils/date';

type MaterialFormBaseProps = {
  categories: Category[];
  submitLabel: string;
  errorMessage?: string;
  isSubmitting?: boolean;
};

/** Create sends the full payload; edit sends only what this form edits (fields it doesn't own are kept). */
type MaterialFormProps = MaterialFormBaseProps &
  (
    | { initialMaterial?: undefined; onSubmit: (payload: MaterialPayload) => Promise<void> }
    | { initialMaterial: Material; onSubmit: (payload: Partial<MaterialPayload>) => Promise<void> }
  );

/** Dates are days in the account time zone (User.timezone), sent as noon there. */
function toFormValues(material: Material | undefined, timeZone: string, today: string): MaterialFormValues {
  return {
    title: material?.title ?? '',
    content: material?.content ?? '',
    sourceUrl: material?.sourceUrl ?? '',
    learnedAt: material ? dateKeyInZone(new Date(material.learnedAt), timeZone) : today,
    categoryId: material?.categoryId ?? '',
  };
}

export function MaterialForm(props: MaterialFormProps) {
  const { categories, initialMaterial, submitLabel, errorMessage, isSubmitting = false } = props;
  const { t } = useTranslation();
  const { timeZone, today } = useAccountToday();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(createMaterialFormSchema(t)),
    defaultValues: toFormValues(initialMaterial, timeZone, today),
  });

  const submit = handleSubmit(async (values) => {
    const base = {
      title: values.title,
      content: values.content ?? '',
      sourceUrl: values.sourceUrl?.trim() ? values.sourceUrl.trim() : null,
      categoryId: values.categoryId ? values.categoryId : null,
    };
    if (props.initialMaterial) {
      // Edit: send only what this form owns, and the date only when it changed, so an unchanged
      // date never reschedules reviews or fails on a different-timezone timestamp, and
      // question/answer edited elsewhere are not overwritten with stale values.
      const initialDate = dateKeyInZone(new Date(props.initialMaterial.learnedAt), timeZone);
      await props.onSubmit({
        ...base,
        ...(values.learnedAt !== initialDate ? { learnedAt: zonedNoonIso(values.learnedAt, timeZone) } : {}),
      });
      return;
    }
    await props.onSubmit({
      ...base,
      description: '',
      question: null,
      answer: null,
      learnedAt: zonedNoonIso(values.learnedAt, timeZone),
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
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <Select
            label={t('materials.fields.category')}
            placeholder={t('materials.fields.noCategory')}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            error={errors.categoryId?.message}
            name={field.name}
            value={field.value ?? ''}
            onChange={field.onChange}
          />
        )}
      />

      <ErrorMessage message={errorMessage} />

      <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
