import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';

const MIN_MS = 1100;

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const started = performance.now();

    const finish = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => setVisible(false), 480);
      }, wait);
    };

    if (document.readyState === 'complete') {
      finish();
      return;
    }

    window.addEventListener('load', finish, { once: true });
    return () => window.removeEventListener('load', finish);
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
