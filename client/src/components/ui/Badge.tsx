import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const tones = {
  neutral: 'bg-brand-50 text-brand-500',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
} as const;

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
