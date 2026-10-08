import { KeyRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function MethodRow({
  icon,
  title,
  status,
  on,
  children,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  on: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className={`mt-0.5 block text-xs ${on ? 'font-semibold text-brand-600' : 'text-muted'}`}>{status}</span>
        </span>
      </div>
      {children ? <div className="sm:w-56 sm:shrink-0">{children}</div> : null}
    </div>
  );
}

/**
 * Account → sign-in methods: email + password and Google on the same account.
 * Connect Google to a password account, or set a password on a Google account (form below);
 * Google can be disconnected only while a password exists, so the account stays reachable.
 */
export function SignInMethods() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPassword = user?.hasPassword !== false;
  const hasGoogle = Boolean(user?.hasGoogle);

  const onCredential = async (credential: string) => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await authApi.linkGoogle({ credential });
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.connected'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await authApi.unlinkGoogle();
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.disconnected'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{t('auth.methods.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.methods.lead')}</p>
      </div>

      <MethodRow
        icon={<KeyRound className="h-5 w-5" aria-hidden />}
        title={t('auth.methods.password')}
        status={hasPassword ? t('auth.methods.passwordOn') : t('auth.methods.passwordOff')}
        on={hasPassword}
      />

      <MethodRow
        icon={<GoogleMark />}
        title={t('auth.methods.google')}
        status={hasGoogle ? t('auth.methods.googleOn') : t('auth.methods.googleOff')}
        on={hasGoogle}
      >
        {hasGoogle ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            isLoading={busy}
            disabled={!hasPassword}
            onClick={() => void onDisconnect()}
          >
            {t('auth.methods.disconnect')}
          </Button>
        ) : (
          <GoogleSignIn
            showDivider={false}
            disabled={busy}
            onCredential={(credential) => void onCredential(credential)}
            onError={() => setError(t('auth.errors.googleUnavailable'))}
          />
        )}
      </MethodRow>
      {hasGoogle && !hasPassword ? <p className="text-xs text-muted">{t('auth.methods.disconnectNeedsPassword')}</p> : null}

      {notice ? <p className="text-sm font-medium text-brand-700">{notice}</p> : null}
      <ErrorMessage message={error ?? undefined} />
    </section>
  );
}
