import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { createLoginSchema, type LoginFormValues } from '@/schemas/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await login(values);
      void navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        setFormError(t('auth.errors.invalidCredentials'));
        return;
      }

      setFormError(t('auth.errors.generic'));
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <ErrorMessage message={formError ?? undefined} />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {t('auth.submitLogin')}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-brand-700">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  );
}
