import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink ring-1 ring-brand-200 hover:bg-brand-50 focus-visible:ring-brand-400',
  ghost: 'bg-transparent text-brand-800 hover:bg-brand-50 focus-visible:ring-brand-400',
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
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
}
