import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMatch'));
      return;
    }
    if (!token) {
      setError(t('auth.errors.invalidEmailToken'));
      return;
    }

    setBusy(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      void navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.resetTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.resetSubtitle')}</p>
      </div>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Input
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={t('auth.passwordHint')}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <ErrorMessage message={error ?? undefined} />
        <Button type="submit" className="w-full" isLoading={busy}>
          {t('auth.resetSubmit')}
        </Button>
      </form>
      <Link to="/login" className="text-sm font-medium text-brand-700">
        {t('nav.login')}
      </Link>
    </div>
  );
}
