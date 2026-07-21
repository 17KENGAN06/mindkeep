import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-10 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
