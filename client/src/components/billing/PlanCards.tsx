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
  tone: 'yes' | 'no';
}) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-snug text-ink sm:text-sm">
      {tone === 'yes' ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
      ) : (
        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      )}
      <span className={tone === 'no' ? 'text-muted' : undefined}>{children}</span>
    </li>
  );
}

type PlanCardsProps = {
  currentPlan?: UserPlan;
  recommended?: 'plus' | 'pro';
  interval?: 'month' | 'year';
  actions: {
    free: ReactNode;
    plus: ReactNode;
    pro: ReactNode;
  };
};

export function PlanCards({
  currentPlan = 'FREE',
  recommended = 'plus',
  interval,
  actions,
}: PlanCardsProps) {
  const { t } = useTranslation();
  const showYear = interval !== 'month';

  const cards = [
    {
      id: 'free' as const,
      name: t('plans.free.name'),
      tagline: t('plans.free.tagline'),
      price: t('plans.free.price'),
      billed: t('plans.free.billed'),
      monthly: undefined as string | undefined,
      accent: false,
      yes: [...asList(t('plans.free.includes', { returnObjects: true })), ...asList(t('plans.free.limits', { returnObjects: true }))],
      no: asList(t('plans.free.without', { returnObjects: true })),
      action: actions.free,
      current: currentPlan === 'FREE',
    },
    {
      id: 'plus' as const,
      name: t('plans.plus.name'),
      tagline: t('plans.plus.tagline'),
      price: showYear ? t('plans.plus.yearPerMonth') : t('plans.plus.monthPrice'),
      billed: showYear ? t('plans.plus.yearCharged') : t('plans.plus.monthCharged'),
      monthly: interval ? undefined : t('plans.plus.monthPrice'),
      accent: recommended === 'plus',
      yes: [
        ...asList(t('plans.plus.includes', { returnObjects: true })),
        ...asList(t('plans.plus.removes', { returnObjects: true })),
      ],
      no: asList(t('plans.plus.without', { returnObjects: true })),
      action: actions.plus,
      current: currentPlan === 'PLUS',
    },
    {
      id: 'pro' as const,
      name: t('plans.pro.name'),
      tagline: t('plans.pro.tagline'),
      price: showYear ? t('plans.pro.yearPerMonth') : t('plans.pro.monthPrice'),
      billed: showYear ? t('plans.pro.yearCharged') : t('plans.pro.monthCharged'),
      monthly: interval ? undefined : t('plans.pro.monthPrice'),
      accent: recommended === 'pro',
      yes: [
        ...asList(t('plans.pro.includes', { returnObjects: true })),
        ...asList(t('plans.pro.unlocks', { returnObjects: true })),
      ],
      no: [] as string[],
      action: actions.pro,
      current: currentPlan === 'PRO',
    },
  ];

  return (
    <div className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-4">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-4 sm:rounded-[1.4rem] sm:p-5 ${
            card.accent
              ? 'z-[1] border-2 border-brand-500 bg-gradient-to-br from-brand-500/35 via-brand-50 to-panel shadow-[0_24px_56px_-28px_rgba(53,111,88,0.9)] ring-2 ring-brand-500/20 lg:scale-[1.04] lg:-translate-y-2'
              : 'border border-line bg-panel/80'
          }`}
        >
          {card.accent ? (
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 left-1/2 h-28 w-40 -translate-x-1/2 rounded-full bg-brand-500/40 blur-3xl"
            />
          ) : null}
          <div className="relative flex items-center justify-between gap-2">
            <p
              className={`text-[11px] font-semibold tracking-[0.16em] uppercase ${
                card.accent ? 'text-brand-500' : 'text-muted'
              }`}
            >
              {card.name}
            </p>
            <div className="flex flex-wrap justify-end gap-1">
              {card.accent ? (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-[#07110d] uppercase">
                  {t('home.pricing.recommended')}
                </span>
              ) : null}
              {card.current ? (
                <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-ink ring-1 ring-line uppercase">
                  {t('plans.current')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="relative mt-2 flex items-end gap-1.5">
            <p className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{card.price}</p>
            {card.id !== 'free' ? (
              <p className="mb-1 text-xs font-medium text-muted sm:text-sm">{t('home.pricing.perMonth')}</p>
            ) : null}
          </div>
          <p className="relative mt-1 text-sm font-medium text-ink">{card.tagline}</p>
          <p className="relative mt-0.5 text-xs text-muted sm:text-sm">{card.billed}</p>
          {card.monthly ? (
            <p className="relative mt-0.5 text-xs text-muted">
              {t('home.pricing.orMonthly')}: {card.monthly}
            </p>
          ) : null}

          <ul className="relative mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
            {card.yes.map((item) => (
              <Line key={item} tone="yes">
                {item}
              </Line>
            ))}
            {card.no.map((item) => (
              <Line key={item} tone="no">
                {item}
              </Line>
            ))}
          </ul>

          <div className="relative mt-auto pt-4 sm:pt-5">{card.action}</div>
        </article>
      ))}
    </div>
  );
}
