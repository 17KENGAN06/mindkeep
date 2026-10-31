import { Droplets } from 'lucide-react';

type WaterGlassesProps = {
  glasses: number;
  goal: number;
  disabled?: boolean;
  /** round: the lighter look of the dashboard card. */
  variant?: 'tile' | 'round';
  onChange: (glasses: number) => void;
};

const BASE_SLOTS = 8;

function visibleSlots(glasses: number): number {
  if (glasses < BASE_SLOTS) return BASE_SLOTS;
  return Math.min(30, glasses + 1);
}

export function WaterGlasses({ glasses, goal, disabled = false, variant = 'tile', onChange }: WaterGlassesProps) {
  const round = variant === 'round';
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
        className={`inline-flex aspect-square w-full items-center justify-center ring-1 transition touch-manipulation disabled:opacity-50 ${
          round ? 'mx-auto max-w-10 rounded-full' : 'max-h-11 rounded-2xl'
        } ${
          filled
            ? 'bg-brand-500/20 text-brand-500 ring-brand-400/50'
            : isGoal
              ? `${round ? 'bg-brand-500/[0.05]' : 'bg-panel'} text-muted ring-brand-400/40`
              : `${round ? 'bg-brand-500/[0.05] ring-line/70' : 'bg-panel ring-line'} text-muted hover:ring-brand-400`
        }`}
        onClick={() => onChange(filled ? index : next)}
      >
        <Droplets className={`${round ? 'h-4 w-4' : 'h-5 w-5'} ${filled ? 'fill-current' : ''}`} aria-hidden />
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
