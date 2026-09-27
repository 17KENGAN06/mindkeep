import { useEffect, useId, useRef, useState, type SelectHTMLAttributes } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
};

type SelectChangeEvent = { target: { value: string; name?: string } };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'menu' | 'panel';
  onChange?: (event: SelectChangeEvent) => void;
};

export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className = '',
  variant,
  value,
  name,
  disabled,
  onChange,
}: SelectProps) {
  const inputId = id ?? name;
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const stringValue = value == null ? '' : String(value);
  const current = options.find((option) => option.value === stringValue);
  const resolvedVariant = variant ?? (options.length <= 3 && !placeholder ? 'panel' : 'menu');

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (next: string) => {
    onChange?.({ target: { value: next, name } });
    setOpen(false);
  };

  const triggerLabel = current?.label ?? placeholder ?? '';
  const compactPanel = resolvedVariant === 'panel' && options.length <= 2 && !placeholder;

  return (
    <div ref={rootRef} className={`relative block min-w-0 space-y-1.5 ${className}`}>
      <span id={inputId} className="text-sm font-medium text-ink">
        {label}
      </span>

      {resolvedVariant === 'panel' ? (
        <div
          role="listbox"
          aria-labelledby={inputId}
          className={`grid min-w-0 gap-1 rounded-2xl bg-brand-50/40 ring-1 ${
            compactPanel ? 'h-11 grid-cols-2 p-1' : 'p-1.5'
          } ${error ? 'ring-red-400' : 'ring-line/70'} ${
            options.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {placeholder ? (
            <button
              type="button"
              role="option"
              aria-selected={stringValue === ''}
              disabled={disabled}
              className={`min-h-10 rounded-xl px-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                stringValue === ''
                  ? 'bg-brand-500 text-[#07110d] shadow-sm'
                  : 'text-muted hover:bg-panel hover:text-ink'
              }`}
              onClick={() => pick('')}
            >
              {placeholder}
            </button>
          ) : null}
          {options.map((option) => {
            const active = option.value === stringValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={disabled}
                className={`${
                  compactPanel ? 'h-full' : 'min-h-10'
                } rounded-xl px-2 text-center text-sm font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 ${
                  active
                    ? 'bg-brand-500 text-[#07110d] shadow-sm'
                    : 'text-muted hover:bg-panel hover:text-ink'
                }`}
                onClick={() => pick(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            aria-labelledby={inputId}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={Boolean(error)}
            className={`flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-panel px-3 text-left text-sm font-semibold outline-none transition hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 ${
              error ? 'border-red-400' : 'border-line'
            } ${current ? 'text-ink' : 'text-muted'}`}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="min-w-0 truncate">{triggerLabel}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-brand-500 transition ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {open ? (
            <div
              id={listId}
              role="listbox"
              aria-labelledby={inputId}
              className="absolute inset-x-0 z-50 mt-2 max-h-72 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl bg-panel p-1.5 shadow-lg ring-1 ring-line"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full bg-brand-500/15 blur-2xl"
              />
              <div className="relative grid min-w-0 gap-0.5">
                {placeholder ? (
                  <button
                    type="button"
                    role="option"
                    aria-selected={stringValue === ''}
                    className={`flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                      stringValue === ''
                        ? 'bg-brand-500 text-[#07110d] shadow-sm'
                        : 'text-ink hover:bg-brand-50'
                    }`}
                    onClick={() => pick('')}
                  >
                    <span className="min-w-0 break-words">{placeholder}</span>
                    {stringValue === '' ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  </button>
                ) : null}
                {options.map((option) => {
                  const active = option.value === stringValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                        active
                          ? 'bg-brand-500 text-[#07110d] shadow-sm'
                          : 'text-ink hover:bg-brand-50'
                      }`}
                      onClick={() => pick(option.value)}
                    >
                      <span className="min-w-0 break-words">{option.label}</span>
                      {active ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}

      {error ? (
        <span className="block text-xs text-red-500" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
