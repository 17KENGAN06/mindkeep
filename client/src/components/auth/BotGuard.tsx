import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';

type BotGuardProps = {
  onReady: (botToken: string | null) => void;
  humanChecked: boolean;
  onHumanCheckedChange: (checked: boolean) => void;
  error?: string;
};

export function BotGuard({
  onReady,
  humanChecked,
  onHumanCheckedChange,
  error,
}: BotGuardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const { botToken } = await authApi.challenge();
        if (!cancelled) {
          onReady(botToken);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          onReady(null);
          setFailed(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-panel/60 p-4">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm leading-snug text-ink">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 rounded border-line accent-[var(--app-accent)]"
          checked={humanChecked}
          onChange={(event) => onHumanCheckedChange(event.target.checked)}
        />
        <span>{t('auth.bot.humanLabel')}</span>
      </label>

      {loading ? <p className="text-xs text-muted">{t('auth.bot.preparing')}</p> : null}
      {failed ? <p className="text-xs text-red-600">{t('auth.bot.challengeFailed')}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
