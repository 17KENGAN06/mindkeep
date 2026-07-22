import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-[#0b100e] hover:bg-brand-400 focus-visible:ring-brand-400 disabled:opacity-50',
  secondary:
    'bg-panel text-ink ring-1 ring-line hover:border-brand-400 hover:ring-brand-400 focus-visible:ring-brand-400',
  ghost: 'bg-transparent text-muted hover:bg-brand-50 hover:text-ink focus-visible:ring-brand-400',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
}
