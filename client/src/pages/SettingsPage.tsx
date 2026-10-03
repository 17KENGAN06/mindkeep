import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Select } from '@/components/ui/Select';
import { APP_MODULES, MODULE_HOME_KEY, selectedModules, type AppModule } from '@/config/appModules';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';

const FALLBACK_ZONES = [
  'Europe/Helsinki',
  'Europe/Kyiv',
  'Europe/Warsaw',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Madrid',
  'UTC',
];

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateWorkspace } = useAuth();
  const [modules, setModules] = useState<AppModule[]>(() => selectedModules(user));
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Europe/Helsinki');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const zones = useMemo(() => {
    const supported =
      typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : FALLBACK_ZONES;
    const list = new Set([...FALLBACK_ZONES, timezone, ...supported.slice(0, 80)]);
    return [...list].sort().map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [timezone]);

  const toggle = (module: AppModule) => {
    setSaved(false);
    setModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module],
    );
  };

  const onSave = async () => {
    if (modules.length === 0) {
      setError(t('settings.needOne'));
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateWorkspace({ enabledModules: modules, timezone });
      setSaved(true);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-3 rounded-3xl border border-line bg-panel/80 p-5">
        <h2 className="text-base font-semibold text-ink">{t('settings.modulesTitle')}</h2>
        <p className="text-sm text-muted">{t('settings.modulesHint')}</p>
        <ul className="space-y-2">
          {APP_MODULES.map((module) => {
            const on = modules.includes(module);
            return (
              <li key={module}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(module)}
                  className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    on
                      ? 'border-brand-400 bg-brand-50/60'
                      : 'border-line bg-transparent text-muted'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      on ? 'border-brand-500 bg-brand-500 text-[#07110d]' : 'border-line'
                    }`}
                  >
                    {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                  </span>
                  <span>
                    <span className="block font-medium text-ink">
                      {t(`home.services.items.${MODULE_HOME_KEY[module]}.title`)}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {t(`home.services.items.${MODULE_HOME_KEY[module]}.text`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5">
        <h2 className="text-base font-semibold text-ink">{t('settings.appearanceTitle')}</h2>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 px-4 py-3">
          <span className="text-sm font-medium text-ink">{t('common.theme')}</span>
          <ThemeToggle />
        </div>
        <div className="space-y-2 rounded-2xl border border-line/70 px-4 py-3">
          <span className="text-sm font-medium text-ink">{t('common.language')}</span>
          <LanguageSwitcher variant="panel" />
        </div>
        <Select
          label={t('auth.timezone')}
          value={timezone}
          options={zones}
          onChange={(event) => {
            setSaved(false);
            setTimezone(event.target.value);
          }}
        />
      </div>

      <ErrorMessage message={error ?? undefined} />
      {saved ? <p className="text-sm text-brand-700">{t('settings.saved')}</p> : null}
      <Button type="button" isLoading={busy} onClick={() => void onSave()}>
        {t('common.save')}
      </Button>
    </section>
  );
}
