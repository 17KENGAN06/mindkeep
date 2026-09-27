import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const token = params.get('token') ?? '';

  useEffect(() => {
    if (!token) {
      setError(t('auth.errors.invalidEmailToken'));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) void navigate('/dashboard', { replace: true });
      } catch (caught) {
        if (!cancelled) setError(mapAuthError(caught, t));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, t, token, verifyEmail]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">{t('auth.verifyTitle')}</h1>
      {error ? (
        <>
          <ErrorMessage message={error} />
          <p className="text-sm text-muted">
            <Link to="/login" className="font-medium text-brand-700">
              {t('nav.login')}
            </Link>
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">{t('auth.verifyWorking')}</p>
      )}
    </div>
  );
}
