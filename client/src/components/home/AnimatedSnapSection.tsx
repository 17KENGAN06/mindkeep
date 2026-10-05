import { useEffect, useState, type ReactNode } from 'react';
import { matchesDesktopSnap } from '@/config/desktopSnap';
import { SectionPlayProvider } from '@/components/home/sectionPlayContext';

type AnimatedSnapSectionProps = {
  id: string;
  activeId: string;
  className?: string;
  children: ReactNode;
};

/**
 * Desktop: replay enter animations when a full-page section becomes active.
 * Mobile: keep content visible after first play — a small scroll must not blank the block.
 */
export function AnimatedSnapSection({
  id,
  activeId,
  className = '',
  children,
}: AnimatedSnapSectionProps) {
  const active = activeId === id;
  const [play, setPlay] = useState(() => active || (typeof window !== 'undefined' && !matchesDesktopSnap()));

  useEffect(() => {
    const desktop = matchesDesktopSnap();

    if (!desktop) {
      setPlay(true);
      return;
    }

    // Keep the active section visible immediately. A false→timeout→true
    // flip often never fires after iPad/Safari back-forward cache restore.
    setPlay(active);
  }, [active]);

  return (
    <section
      id={id}
      className={`home-snap-section ${play ? 'is-inview' : ''} ${className}`.trim()}
      data-active={active ? 'true' : 'false'}
    >
      <SectionPlayProvider play={play}>{children}</SectionPlayProvider>
    </section>
  );
}
