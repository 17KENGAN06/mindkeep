import { useEffect, useState, type ReactNode } from 'react';

type AnimatedSnapSectionProps = {
  id: string;
  activeId: string;
  className?: string;
  children: ReactNode;
};

/**
 * Forces a paint of the hidden state before adding is-inview,
 * so CSS keyframe enter animations always replay on section change.
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
    if (!active) {
      setPlay(false);
      return;
    }

    setPlay(false);
    const timerId = window.setTimeout(() => setPlay(true), 50);
    return () => window.clearTimeout(timerId);
  }, [active]);

  return (
    <section
      id={id}
      className={`home-snap-section ${play ? 'is-inview' : ''} ${className}`.trim()}
      data-active={active ? 'true' : 'false'}
    >
      {children}
    </section>
  );
}
