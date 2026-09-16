import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';

const MIN_MS = 900;
const MAX_MS = 1800;

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let hidden = false;
    let leaveTimer = 0;

    const hide = () => {
      if (hidden) return;
      hidden = true;
      setLeaving(true);
      leaveTimer = window.setTimeout(() => setVisible(false), 480);
    };

    const minTimer = window.setTimeout(hide, MIN_MS);
    const maxTimer = window.setTimeout(hide, MAX_MS);

    return () => {
      hidden = true;
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
      window.clearTimeout(leaveTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface transition-opacity duration-500 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Mindkeep"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="preloader-ring absolute inset-0 rounded-full border border-brand-500/25 border-t-brand-500" />
        <div className="preloader-mark">
          <BrandMark className="h-14 w-14" />
        </div>
      </div>
      <p className="font-display mt-8 text-sm font-semibold tracking-[0.35em] text-ink uppercase">
        Mindkeep
      </p>
      <p className="mt-3 text-[10px] tracking-[0.4em] text-brand-500 uppercase">Loading</p>
    </div>
  );
}
