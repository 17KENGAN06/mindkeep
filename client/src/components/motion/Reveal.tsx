import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  trigger?: 'viewport' | 'mount';
  direction?: 'up' | 'left' | 'right' | 'scale';
};

const hidden = {
  up: { opacity: 0, y: 26 },
  left: { opacity: 0, x: -24 },
  right: { opacity: 0, x: 24 },
  scale: { opacity: 0, scale: 0.96, y: 10 },
} as const;

/** Fade/rise on mount or when the element enters the viewport (Motion). */
export function Reveal({
  children,
  className = '',
  delayMs = 0,
  trigger = 'viewport',
  direction = 'up',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(trigger === 'mount');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (trigger === 'mount') {
      const frameId = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trigger]);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden[direction]}
      animate={visible ? { opacity: 1, x: 0, y: 0, scale: 1 } : hidden[direction]}
      transition={{
        duration: 0.58,
        delay: visible ? delayMs / 1000 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
