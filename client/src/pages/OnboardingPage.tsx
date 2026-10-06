import { CheckSquare, GraduationCap, NotebookPen, Repeat, Utensils, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { APP_MODULES, type AppModule } from '@/config/appModules';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';

const MODULE_ICONS: Record<AppModule, typeof CheckSquare> = {
  tasks: CheckSquare,
  review: GraduationCap,
  finance: Wallet,
  habits: Repeat,
  notes: NotebookPen,
  nutrition: Utensils,
};

export function OnboardingPage() {
  const { t } = useTranslation();
  const { completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [picked, setPicked] = useState<AppModule[]>([]);
  const [macros, setMacros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = APP_MODULES.length;
  const intro = step < 0;
  const asking = step >= 0 && step < total;
  const module = asking ? APP_MODULES[step] : null;
  const Icon = module ? MODULE_ICONS[module] : null;
  const selected = useMemo(() => new Set(picked), [picked]);

  const choose = (want: boolean) => {
    if (!module) return;
    setError(null);
    if (module === 'nutrition' && !want) setMacros(false);
    setPicked((current) => {
      const next = current.filter((item) => item !== module);
      return want ? [...next, module] : next;
    });
    setStep((value) => value + 1);
  };

  const onFinish = async () => {
    if (picked.length === 0) {
      setError(t('onboarding.needOne'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(picked, picked.includes('nutrition') ? macros : undefined);
      void navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const card = (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <BrandLockup size="sm" to="" className="min-w-0" />
        <button
          type="button"
          className="text-sm font-medium text-muted hover:text-ink"
          onClick={() => void logout()}
        >
          {t('nav.logout')}
        </button>
      </div>

      <div className="mt-6 flex gap-1.5" aria-hidden>
        {APP_MODULES.map((item, index) => (
          <span
            key={item}
            className={`h-1.5 flex-1 rounded-full ${!intro && index <= step ? 'bg-brand-500' : 'bg-line'}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs tracking-[0.18em] text-muted uppercase">
        {intro
          ? t('onboarding.introProgress')
          : t('onboarding.progress', { current: Math.min(step + 1, total), total })}
      </p>

      {intro ? (
        <>
          <p className="mt-8 font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('onboarding.eyebrow')}
          </p>
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('onboarding.introTitle')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{t('onboarding.introBody')}</p>
          <div className="mt-auto pt-10">
            <Button type="button" className="w-full" onClick={() => setStep(0)}>
              {t('onboarding.introStart')}
            </Button>
          </div>
        </>
      ) : asking && module && Icon ? (
        <>
          <p className="mt-8 font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('onboarding.eyebrow')}
          </p>
          <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
            <Icon className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t(`onboarding.modules.${module}.title`)}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {t(`onboarding.modules.${module}.text`)}
          </p>
          {module === 'nutrition' ? (
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-line px-4 py-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand-500"
                checked={macros}
                onChange={(event) => setMacros(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  {t('onboarding.nutritionMacros.title')}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {t('onboarding.nutritionMacros.text')}
                </span>
              </span>
            </label>
          ) : null}
          <div className="mt-auto flex flex-col gap-3 pt-10 sm:flex-row">
            <Button type="button" className="w-full sm:flex-1" onClick={() => choose(true)}>
              {t('onboarding.wantThis')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={() => choose(false)}
            >
              {t('onboarding.skipThis')}
            </Button>
          </div>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-brand-700"
            onClick={() => setStep((value) => value - 1)}
          >
            {t('common.back')}
          </button>
        </>
      ) : (
        <>
          <h1 className="font-display mt-10 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('onboarding.finishTitle')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{t('onboarding.finishBody')}</p>
          {picked.length === 0 ? (
            <p className="mt-4 text-sm text-red-600">{t('onboarding.needOne')}</p>
          ) : (
            <ul className="mt-6 space-y-2">
              {APP_MODULES.filter((item) => selected.has(item)).map((item) => (
                <li key={item} className="rounded-2xl bg-brand-50/50 px-4 py-3 text-sm font-medium text-ink">
                  {t(`onboarding.modules.${item}.title`)}
                </li>
              ))}
            </ul>
          )}
          <ErrorMessage message={error ?? undefined} />
          <div className="mt-auto flex flex-col gap-3 pt-10 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:flex-1"
              isLoading={busy}
              disabled={picked.length === 0}
              onClick={() => void onFinish()}
            >
              {t('onboarding.finish')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={() => setStep(total - 1)}
            >
              {t('common.back')}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-surface md:flex md:items-center md:justify-center md:bg-ink/55 md:p-6 md:backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="flex min-h-dvh w-full flex-col overflow-y-auto bg-surface px-5 py-6 sm:px-8 md:min-h-0 md:max-h-[90dvh] md:max-w-xl md:rounded-[2rem] md:border md:border-line md:p-8 md:shadow-[0_28px_80px_rgba(0,0,0,0.28)]"
      >
        {card}
      </div>
    </div>
  );
}
