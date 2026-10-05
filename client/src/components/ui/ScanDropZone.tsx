import { Images } from 'lucide-react';
import { useState, type DragEvent } from 'react';

type ScanDropZoneProps = {
  label: string;
  hint: string;
  disabled?: boolean;
  onPick: () => void;
  onFiles: (files: File[]) => void;
};

export function ScanDropZone({ label, hint, disabled, onPick, onFiles }: ScanDropZoneProps) {
  const [over, setOver] = useState(false);

  const onDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!disabled) setOver(true);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (disabled) return;
        onFiles(Array.from(event.dataTransfer.files ?? []));
      }}
      className={`flex min-h-32 w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center transition touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 ${
        over ? 'border-brand-400 bg-brand-50/70' : 'border-line bg-brand-50/30 hover:border-brand-400'
      }`}
    >
      <Images className="h-6 w-6 text-brand-500" aria-hidden />
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  );
}
