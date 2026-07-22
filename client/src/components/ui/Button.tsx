import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'min-h-11 bg-brand-500 text-[#07110d] hover:bg-brand-400 focus-visible:ring-brand-400 disabled:opacity-50 active:scale-[0.98]',
  secondary:
    'min-h-11 bg-panel text-ink ring-1 ring-line hover:border-brand-400 hover:ring-brand-400 focus-visible:ring-brand-400 active:scale-[0.98]',
  ghost:
    'min-h-11 bg-transparent text-muted hover:bg-brand-50 hover:text-ink focus-visible:ring-brand-400 active:scale-[0.98]',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  loadingText,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-base font-semibold transition touch-manipulation sm:w-auto sm:px-4 sm:py-2.5 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
