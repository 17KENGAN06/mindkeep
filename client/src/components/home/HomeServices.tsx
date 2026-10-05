import { CheckSquare, GraduationCap, NotebookPen, Repeat, Utensils, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SnapReveal } from '@/components/home/SnapReveal';
import { HOME_SNAP_SHELL } from '@/config/layout';

const SERVICES = [
  { key: 'tasks', icon: CheckSquare },
  { key: 'learning', icon: GraduationCap },
  { key: 'finance', icon: Wallet },
  { key: 'habits', icon: Repeat },
  { key: 'notes', icon: NotebookPen },
  { key: 'nutrition', icon: Utensils },
] as const;

export function HomeServices() {
  const { t } = useTranslation();

  return (
    <div className={HOME_SNAP_SHELL}>
      <SnapReveal direction="left">
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('home.services.eyebrow')}
        </p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:mt-3 sm:text-[1.85rem] lg:text-3xl xl:text-5xl">
          {t('home.services.title')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base xl:text-lg">
          {t('home.services.subtitle')}
        </p>
      </SnapReveal>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-3">
        {SERVICES.map((item, index) => {
          const Icon = item.icon;
          return (
            <SnapReveal key={item.key} direction="scale" delay={0.08 + index * 0.05}>
              <article className="glass-panel group flex h-full items-start gap-4 rounded-[1.35rem] p-4 sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-[11px] tracking-[0.18em] text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-base font-semibold text-ink sm:text-lg">
                      {t(`home.services.items.${item.key}.title`)}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {t(`home.services.items.${item.key}.text`)}
                  </p>
                </div>
              </article>
            </SnapReveal>
          );
        })}
      </div>
    </div>
  );
}
