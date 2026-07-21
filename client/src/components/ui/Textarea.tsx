import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        id={inputId}
        className={`min-h-28 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-400' : 'border-brand-200'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <span className="block text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
