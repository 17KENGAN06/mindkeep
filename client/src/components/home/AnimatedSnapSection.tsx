import { useEffect, useState, type ReactNode } from 'react';
import { SectionPlayProvider } from '@/components/home/sectionPlayContext';

type AnimatedSnapSectionProps = {
  id: string;
  activeId: string;
  className?: string;
  children: ReactNode;
};

function isDesktopSnap(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
}

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
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const desktop = isDesktopSnap();

    if (!active) {
      if (desktop) setPlay(false);
      return;
    }

    if (!desktop) {
      setPlay(true);
      return;
    }

    setPlay(false);
    const timerId = window.setTimeout(() => setPlay(true), 40);
    return () => window.clearTimeout(timerId);
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
