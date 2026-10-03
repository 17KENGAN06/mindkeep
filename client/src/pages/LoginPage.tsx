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
import { env } from '@/config/env';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import { createLoginSchema, type LoginFormValues } from '@/schemas/auth';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { googleLogin, login, confirmLogin } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [botError, setBotError] = useState<string | undefined>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [savedLogin, setSavedLogin] = useState<LoginFormValues | null>(null);
  const challengeReady = botToken !== null;
  const maintenance = env.maintenanceMode;

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

    if (!botToken) {
      setBotError(t('auth.bot.challengeFailed'));
      return;
    }

    try {
      await login({
        email: values.email,
        password: values.password,
        locale: i18n.resolvedLanguage ?? i18n.language,
        botToken,
        website: values.website ?? '',
      });
      setSavedLogin(values);
      setPendingEmail(values.email);
      setLoginCode('');
    } catch (error) {
      setFormError(mapAuthError(error, t));
    }
  });

  const onConfirmCode = async () => {
    if (!pendingEmail) return;
    setFormError(null);
    setCodeBusy(true);
    try {
      await confirmLogin({ email: pendingEmail, code: loginCode });
      void navigate('/dashboard');
    } catch (error) {
      setFormError(mapAuthError(error, t));
    } finally {
      setCodeBusy(false);
    }
  };

  const onResend = async () => {
    if (!savedLogin || !botToken) return;
    setFormError(null);
    setCodeBusy(true);
    try {
      await login({
        email: savedLogin.email,
        password: savedLogin.password,
        locale: i18n.resolvedLanguage ?? i18n.language,
        botToken,
        website: savedLogin.website ?? '',
      });
    } catch (error) {
      setFormError(mapAuthError(error, t));
    } finally {
      setCodeBusy(false);
    }
  };

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

  if (pendingEmail) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.loginCodeTitle')}</h1>
          <p className="mt-1 text-sm text-muted">
            {t('auth.loginCodeSubtitle', { email: pendingEmail })}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onConfirmCode();
          }}
        >
          <Input
            label={t('auth.loginCodeLabel')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={loginCode}
            onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <ErrorMessage message={formError ?? undefined} />
          <Button type="submit" className="w-full" isLoading={codeBusy} disabled={loginCode.length !== 6}>
            {t('auth.submitLoginCode')}
          </Button>
        </form>

        <p className="text-sm text-muted">
          <button
            type="button"
            className="font-medium text-brand-700"
            disabled={codeBusy}
            onClick={() => void onResend()}
          >
            {t('auth.resendLoginCode')}
          </button>
        </p>
        <p className="text-sm text-muted">
          <button
            type="button"
            className="font-medium text-brand-700"
            onClick={() => {
              setPendingEmail(null);
              setLoginCode('');
              setFormError(null);
            }}
          >
            {t('auth.backToLogin')}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">
          {maintenance ? t('maintenance.loginTitle') : t('auth.loginTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {maintenance ? t('maintenance.loginSubtitle') : t('auth.loginSubtitle')}
        </p>
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
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
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
          {maintenance ? t('maintenance.submitLogin') : t('auth.submitLogin')}
        </Button>
      </form>

      {maintenance ? null : (
        <p className="text-sm text-muted">
          <Link to="/forgot-password" className="font-medium text-brand-700">
            {t('auth.forgotPassword')}
          </Link>
        </p>
      )}

      <GoogleSignIn
        onCredential={(credential) => void handleGoogleCredential(credential)}
        onError={() => setFormError(t('auth.errors.googleUnavailable'))}
        disabled={isGoogleLoading}
      />

      {maintenance ? (
        <p className="text-sm text-muted">
          <Link to="/" className="font-medium text-brand-700">
            {t('maintenance.backHome')}
          </Link>
        </p>
      ) : (
        <p className="text-sm text-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-brand-700">
            {t('nav.register')}
          </Link>
        </p>
      )}
    </div>
  );
}
