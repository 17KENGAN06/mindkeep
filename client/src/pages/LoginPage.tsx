import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BotGuard } from '@/components/auth/BotGuard';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import { createLoginSchema, type LoginFormValues } from '@/schemas/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { googleLogin, login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [botError, setBotError] = useState<string | undefined>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const challengeReady = botToken !== null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
      website: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setBotError(undefined);

    if (!humanChecked) {
      setBotError(t('auth.bot.humanRequired'));
      return;
    }

    try {
      await login({
        email: values.email,
        password: values.password,
        ...(botToken ? { botToken } : {}),
        website: values.website ?? '',
      });
      void navigate('/dashboard');
    } catch (error) {
      setFormError(mapAuthError(error, t));
    }
  });

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Helsinki';
      await googleLogin({ credential, timezone });
      void navigate('/dashboard');
    } catch (error) {
      setFormError(mapAuthError(error, t));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>
      </div>

      <form className="relative space-y-4" onSubmit={onSubmit} noValidate>
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

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0 [clip:rect(0,0,0,0)]"
          {...register('website')}
        />

        <BotGuard
          onReady={setBotToken}
          humanChecked={humanChecked}
          onHumanCheckedChange={setHumanChecked}
          error={botError}
        />

        <ErrorMessage message={formError ?? undefined} />

        <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!challengeReady}>
          {t('auth.submitLogin')}
        </Button>
      </form>

      <GoogleSignIn
        onCredential={(credential) => void handleGoogleCredential(credential)}
        onError={() => setFormError(t('auth.errors.googleUnavailable'))}
        disabled={isGoogleLoading}
      />

      <p className="text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-brand-700">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  );
}
