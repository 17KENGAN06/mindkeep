import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlanCards } from '@/components/billing/PlanCards';
import { SnapReveal } from '@/components/home/SnapReveal';
import { Button } from '@/components/ui/Button';
import { HOME_SNAP_SHELL } from '@/config/layout';
import { useAuth } from '@/features/auth/useAuth';
import { accountPlan } from '@/features/billing/planLimit';

export function HomePricing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const current = accountPlan(user);

  return (
    <div className={HOME_SNAP_SHELL}>
      <SnapReveal direction="left">
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('plans.eyebrow')}
        </p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:mt-3 sm:text-4xl xl:text-5xl">
          {t('plans.title')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base xl:text-lg">
          {t('plans.subtitle')}
        </p>
      </SnapReveal>

      <SnapReveal delay={0.1} className="mt-6 lg:mt-8">
        <PlanCards
          currentPlan={isAuthenticated ? current : null}
          actions={{
            free: (
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="block">
                <Button variant="secondary" className="w-full sm:w-full">
                  {isAuthenticated ? t('nav.dashboard') : t('plans.ctaFree')}
                </Button>
              </Link>
            ),
            plus: (
              <Link to={isAuthenticated ? '/plans' : '/register'} className="block">
                <Button className="w-full gap-2 sm:w-full">
                  {t('plans.ctaPlus')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            ),
            pro: (
              <Link to={isAuthenticated ? '/plans' : '/register'} className="block">
                <Button className="w-full gap-2 sm:w-full">
                  {t('plans.ctaPro')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            ),
          }}
        />
      </SnapReveal>
    </div>
  );
}
