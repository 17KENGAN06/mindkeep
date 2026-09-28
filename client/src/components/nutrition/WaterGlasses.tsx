import { Droplets } from 'lucide-react';

type WaterGlassesProps = {
  glasses: number;
  goal: number;
  disabled?: boolean;
  onChange: (glasses: number) => void;
};

const BASE_SLOTS = 8;

function visibleSlots(glasses: number): number {
  if (glasses < BASE_SLOTS) return BASE_SLOTS;
  return Math.min(30, glasses + 1);
}

export function WaterGlasses({ glasses, goal, disabled = false, onChange }: WaterGlassesProps) {
  const slots = visibleSlots(glasses);
  const extra = Math.max(0, slots - BASE_SLOTS);

  const renderSlot = (index: number) => {
    const filled = index < glasses;
    const next = index + 1;
    const isGoal = next === goal;
    return (
      <button
        key={index}
        type="button"
        disabled={disabled}
        aria-pressed={filled}
        aria-label={`${next}`}
        className={`inline-flex aspect-square w-full max-h-11 items-center justify-center rounded-2xl ring-1 transition touch-manipulation disabled:opacity-50 ${
          filled
            ? 'bg-brand-500/20 text-brand-500 ring-brand-400/50'
            : isGoal
              ? 'bg-panel text-muted ring-brand-400/40'
              : 'bg-panel text-muted ring-line hover:ring-brand-400'
        }`}
        onClick={() => onChange(filled ? index : next)}
      >
        <Droplets className={`h-5 w-5 ${filled ? 'fill-current' : ''}`} aria-hidden />
      </button>
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2">{Array.from({ length: BASE_SLOTS }, (_, index) => renderSlot(index))}</div>
      {extra > 0 ? (
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
          {Array.from({ length: extra }, (_, index) => renderSlot(BASE_SLOTS + index))}
        </div>
      ) : null}
    </div>
  );
}
