import { Droplets } from 'lucide-react';

type WaterGlassesProps = {
  glasses: number;
  goal: number;
  disabled?: boolean;
  onChange: (glasses: number) => void;
};

export function WaterGlasses({ glasses, goal, disabled = false, onChange }: WaterGlassesProps) {
  const slots = Math.min(30, Math.max(goal + 2, glasses + 1, 8));

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: slots }, (_, index) => {
        const filled = index < glasses;
        const next = index + 1;
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-pressed={filled}
            aria-label={`${next}`}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 transition touch-manipulation disabled:opacity-50 ${
              filled
                ? 'bg-sky-500/20 text-sky-400 ring-sky-400/40'
                : 'bg-panel text-muted ring-line hover:ring-brand-400'
            }`}
            onClick={() => onChange(filled ? index : next)}
          >
            <Droplets className={`h-5 w-5 ${filled ? 'fill-current' : ''}`} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
