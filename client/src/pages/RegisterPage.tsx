import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { createRegisterSchema, type RegisterFormValues } from '@/schemas/auth';

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Helsinki';
  } catch {
    return 'Europe/Helsinki';
  }
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const defaultTimezone = useMemo(() => detectTimezone(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      timezone: defaultTimezone,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await registerUser(values);
      void navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'REGISTER_FAILED') {
        setFormError(t('auth.errors.registerFailed'));
        return;
      }

      setFormError(t('auth.errors.generic'));
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.registerSubtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Input
          label={t('auth.name')}
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Input
          label={t('auth.timezone')}
          error={errors.timezone?.message}
          {...register('timezone')}
        />

        <ErrorMessage message={formError ?? undefined} />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {t('auth.submitRegister')}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-brand-700">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
