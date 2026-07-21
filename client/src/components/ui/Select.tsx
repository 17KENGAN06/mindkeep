import type { SelectHTMLAttributes } from 'react';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        id={inputId}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-400' : 'border-brand-200'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="block text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
