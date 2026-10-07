import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import { detectBrowserTimezone, useAccountToday } from '@/features/time/useAccountToday';
import { zonesShareClock } from '@/utils/date';

const KEEP_KEY_PREFIX = 'mindkeep.timezoneKeep:';

function keepKey(account: string, device: string): string {
  return `${KEEP_KEY_PREFIX}${account}|${device}`;
}

function readKept(account: string, device: string): boolean {
  try {
    return window.localStorage.getItem(keepKey(account, device)) === '1';
  } catch {
    // Storage blocked: just show the suggestion again.
    return false;
  }
}

/** Browser time zone, re-read when the tab becomes visible again (travel, OS change). */
function useBrowserTimezone(): string {
  const [device, setDevice] = useState(detectBrowserTimezone);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setDevice(detectBrowserTimezone());
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  return device;
}

/**
 * Dashboard banner: the account time zone (User.timezone) is the source of truth for "today".
 * When the browser keeps a different clock, suggest switching — never change it silently.
 */
export function TimezoneSuggestion() {
  const { t } = useTranslation();
  const { user, updateWorkspace } = useAuth();
  const { timeZone: account, today } = useAccountToday();
  const device = useBrowserTimezone();
  const [keptPair, setKeptPair] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = keepKey(account, device);
  const differs = Boolean(user) && !zonesShareClock(account, device, today);
  if (!differs || keptPair === pair || readKept(account, device)) return null;

  const switchToBrowser = async () => {
    setError(null);
    setBusy(true);
    try {
      await updateWorkspace({ timezone: device });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const keepAccount = () => {
    setKeptPair(pair);
    try {
      window.localStorage.setItem(pair, '1');
    } catch {
      // Not persisted; the banner stays hidden for this page view.
    }
  };

  return (
    <section className="rounded-2xl border border-brand-500/60 bg-panel/80 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-ink">{t('timezone.title')}</h2>
      <p className="mt-1 text-sm text-muted">{t('timezone.body', { device, account })}</p>
      <div className="mt-2">
        <ErrorMessage message={error ?? undefined} />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button type="button" isLoading={busy} onClick={() => void switchToBrowser()}>
          {t('timezone.use')}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={keepAccount}>
          {t('timezone.keep')}
        </Button>
      </div>
    </section>
  );
}

/**
 * Settings: show the browser zone next to the account zone dropdown and let the user fill the
 * dropdown with it; the existing Save button applies the change.
 */
export function BrowserTimezoneHint({
  selected,
  onUseBrowser,
}: {
  selected: string;
  onUseBrowser: (timezone: string) => void;
}) {
  const { t } = useTranslation();
  const { today } = useAccountToday();
  const device = useBrowserTimezone();
  const differs = !zonesShareClock(selected, device, today);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{t('timezone.browserLine', { timezone: device })}</p>
      {differs ? (
        <Button type="button" variant="secondary" onClick={() => onUseBrowser(device)}>
          {t('timezone.use')}
        </Button>
      ) : null}
    </div>
  );
}
