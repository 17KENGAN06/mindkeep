import { Check, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserPlan } from '@/types/auth';

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function Line({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'yes' | 'limit' | 'no';
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
      {tone === 'yes' ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
      ) : (
        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
      )}
      <span className={tone === 'no' ? 'text-muted' : undefined}>{children}</span>
    </li>
  );
}

type PlanCardsProps = {
  currentPlan?: UserPlan;
  recommended?: 'plus' | 'pro';
  actions: {
    free: ReactNode;
    plus: ReactNode;
    pro: ReactNode;
  };
};

export function PlanCards({ currentPlan = 'FREE', recommended = 'plus', actions }: PlanCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'free' as const,
      name: t('plans.free.name'),
      tagline: t('plans.free.tagline'),
      price: t('plans.free.price'),
      billed: t('plans.free.billed'),
      accent: false,
      includes: asList(t('plans.free.includes', { returnObjects: true })),
      limitsTitle: t('plans.limits'),
      limits: asList(t('plans.free.limits', { returnObjects: true })),
      extraTitle: t('plans.without'),
      extra: asList(t('plans.free.without', { returnObjects: true })),
      extraTone: 'no' as const,
      action: actions.free,
      current: currentPlan === 'FREE',
    },
    {
      id: 'plus' as const,
      name: t('plans.plus.name'),
      tagline: t('plans.plus.tagline'),
      price: t('plans.plus.yearPerMonth'),
      billed: t('plans.plus.yearCharged'),
      monthly: t('plans.plus.monthPrice'),
      accent: recommended === 'plus',
      includes: asList(t('plans.plus.includes', { returnObjects: true })),
      limitsTitle: t('plans.removes'),
      limits: asList(t('plans.plus.removes', { returnObjects: true })),
      extraTitle: t('plans.without'),
      extra: asList(t('plans.plus.without', { returnObjects: true })),
      extraTone: 'no' as const,
      action: actions.plus,
      current: currentPlan === 'PLUS',
    },
    {
      id: 'pro' as const,
      name: t('plans.pro.name'),
      tagline: t('plans.pro.tagline'),
      price: t('plans.pro.yearPerMonth'),
      billed: t('plans.pro.yearCharged'),
      monthly: t('plans.pro.monthPrice'),
      accent: recommended === 'pro',
      includes: asList(t('plans.pro.includes', { returnObjects: true })),
      limitsTitle: t('plans.unlocks'),
      limits: asList(t('plans.pro.unlocks', { returnObjects: true })),
      extraTitle: '',
      extra: [],
      extraTone: 'yes' as const,
      action: actions.pro,
      current: currentPlan === 'PRO',
    },
  ];

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-4 xl:gap-5">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`relative flex min-h-[32rem] flex-col overflow-hidden rounded-[1.6rem] p-5 sm:min-h-[34rem] sm:p-6 ${
            card.accent
              ? 'border border-brand-500/55 bg-gradient-to-br from-brand-500/20 via-panel to-panel shadow-[0_20px_50px_-32px_rgba(53,111,88,0.7)]'
              : 'border border-line bg-panel/80'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${
                card.accent ? 'text-brand-500' : 'text-muted'
              }`}
            >
              {card.name}
            </p>
            {card.accent ? (
              <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-[#07110d] uppercase">
                {t('home.pricing.recommended')}
              </span>
            ) : card.current ? (
              <span className="rounded-full bg-panel px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-ink ring-1 ring-line uppercase">
                {t('plans.current')}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {card.price}
            </p>
            {card.id !== 'free' ? (
              <p className="mb-1.5 text-sm font-medium text-muted">{t('home.pricing.perMonth')}</p>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-medium text-ink">{card.tagline}</p>
          <p className="mt-1 text-sm text-muted">{card.billed}</p>
          {card.monthly ? (
            <p className="mt-1 text-xs text-muted">
              {t('home.pricing.orMonthly')}: {card.monthly} {t('home.pricing.monthBilled')}
            </p>
          ) : null}

          <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            {t('plans.includes')}
          </p>
          <ul className="mt-2 space-y-2">
            {card.includes.map((item) => (
              <Line key={item} tone="yes">
                {item}
              </Line>
            ))}
          </ul>

          <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            {card.limitsTitle}
          </p>
          <ul className="mt-2 space-y-2">
            {card.limits.map((item) => (
              <Line key={item} tone={card.id === 'free' ? 'limit' : 'yes'}>
                {item}
              </Line>
            ))}
          </ul>

          {card.extra.length > 0 ? (
            <>
              <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                {card.extraTitle}
              </p>
              <ul className="mt-2 space-y-2">
                {card.extra.map((item) => (
                  <Line key={item} tone={card.extraTone}>
                    {item}
                  </Line>
                ))}
              </ul>
            </>
          ) : null}

          <div className="mt-auto pt-6">{card.action}</div>
        </article>
      ))}
    </div>
  );
}
