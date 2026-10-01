import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

type CatchProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type CatchState = { hasError: boolean };

class CatchBoundary extends Component<CatchProps, CatchState> {
  state: CatchState = { hasError: false };

  static getDerivedStateFromError(): CatchState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <CatchBoundary
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-md text-base text-ink">{t('common.loadError')}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            {t('common.reload')}
          </Button>
        </div>
      }
    >
      {children}
    </CatchBoundary>
  );
}
