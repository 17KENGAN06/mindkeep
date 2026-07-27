import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
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
  const { googleLogin, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [botError, setBotError] = useState<string | undefined>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const defaultTimezone = useMemo(() => detectTimezone(), []);
  const challengeReady = botToken !== null;

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
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        timezone: values.timezone,
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
      await googleLogin({ credential, timezone: defaultTimezone });
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
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.registerSubtitle')}</p>
      </div>

      <form className="relative space-y-4" onSubmit={onSubmit} noValidate>
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
          {t('auth.submitRegister')}
        </Button>
      </form>

      <GoogleSignIn
        onCredential={(credential) => void handleGoogleCredential(credential)}
        onError={() => setFormError(t('auth.errors.googleUnavailable'))}
        disabled={isGoogleLoading}
      />

      <p className="text-sm text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-brand-700">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
