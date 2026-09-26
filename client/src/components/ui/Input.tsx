import type { InputHTMLAttributes, ReactNode } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  action?: ReactNode;
};

export function Input({ label, error, hint, action, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div
      className={
        action
          ? 'grid grid-cols-1 items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(12rem,1fr)_auto]'
          : 'block space-y-1.5'
      }
    >
      <label className={`block text-sm font-medium text-ink${action ? ' sm:col-span-2' : ''}`} htmlFor={inputId}>
        {label}
      </label>
      <div className={action ? 'min-w-0 sm:col-start-1 sm:row-start-2' : undefined}>
        <input
          id={inputId}
          className={`min-w-0 w-full rounded-xl border bg-panel px-3 py-2.5 text-base text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
            error ? 'border-red-400' : 'border-line'
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {action ? <div className="sm:col-start-2 sm:row-start-2">{action}</div> : null}
      {hint && !error ? (
        <span id={`${inputId}-hint`} className={`block text-xs text-muted${action ? ' sm:col-start-1' : ''}`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} className={`block text-xs text-red-500${action ? ' sm:col-start-1' : ''}`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
