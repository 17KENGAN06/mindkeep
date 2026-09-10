import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { useSectionPlay } from '@/components/home/sectionPlayContext';

type SnapRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale' | 'none';
};

const hiddenByDirection = {
  up: { opacity: 0, y: 28 },
  left: { opacity: 0, x: -28 },
  right: { opacity: 0, x: 28 },
  scale: { opacity: 0, scale: 0.94, y: 12 },
  none: { opacity: 0 },
} as const;

const visible = { opacity: 1, x: 0, y: 0, scale: 1 };

/** Entrance animation tied to home snap-section play state. */
export function SnapReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: SnapRevealProps) {
  const play = useSectionPlay();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={hiddenByDirection[direction]}
      animate={play ? visible : hiddenByDirection[direction]}
      transition={{
        duration: 0.62,
        delay: play ? delay : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
