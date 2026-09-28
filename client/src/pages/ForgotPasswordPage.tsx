import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { BotGuard } from '@/components/auth/BotGuard';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { mapAuthError } from '@/features/auth/mapAuthError';

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [botToken, setBotToken] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [botError, setBotError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const challengeReady = botToken !== null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
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

    setBusy(true);
    try {
      await authApi.forgotPassword({
        email: email.trim(),
        locale: i18n.resolvedLanguage ?? i18n.language,
        botToken,
        website: '',
      });
      setSent(true);
    } catch (error) {
      setFormError(mapAuthError(error, t));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.forgotTitle')}</h1>
        <p className="text-sm leading-relaxed text-muted">{t('auth.forgotSent')}</p>
        <Link to="/login" className="text-sm font-medium text-brand-700">
          {t('nav.login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.forgotTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.forgotSubtitle')}</p>
      </div>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <BotGuard
          onReady={setBotToken}
          humanChecked={humanChecked}
          onHumanCheckedChange={setHumanChecked}
          error={botError}
        />
        <ErrorMessage message={formError ?? undefined} />
        <Button type="submit" className="w-full" isLoading={busy} disabled={!challengeReady}>
          {t('auth.forgotSubmit')}
        </Button>
      </form>
      <p className="text-sm text-muted">
        <Link to="/login" className="font-medium text-brand-700">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
