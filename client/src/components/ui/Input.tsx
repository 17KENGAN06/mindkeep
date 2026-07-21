import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-400' : 'border-brand-200'
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error ? (
        <span id={`${inputId}-hint`} className="block text-xs text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} className="block text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
