import { Check, Footprints } from 'lucide-react';

type StepsCheckProps = {
  done: boolean;
  goal: number;
  disabled?: boolean;
  label: string;
  hint: string;
  onChange: (done: boolean) => void;
};

export function StepsCheck({ done, goal, disabled = false, label, hint, onChange }: StepsCheckProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={done}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 transition touch-manipulation disabled:opacity-50 ${
        done
          ? 'bg-brand-500/15 text-ink ring-brand-400/50'
          : 'bg-panel text-ink ring-line hover:ring-brand-400'
      }`}
      onClick={() => onChange(!done)}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${
          done ? 'bg-brand-500 text-[#07110d] ring-brand-500' : 'bg-panel text-muted ring-line'
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> : <Footprints className="h-4 w-4" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">
          {hint} · {goal.toLocaleString()}
        </span>
      </span>
    </button>
  );
}
