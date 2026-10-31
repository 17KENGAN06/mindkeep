import { useEffect, useRef } from 'react';

/** How far the lines lag behind the page, and the most they ever move. */
const PARALLAX = 0.05;
const PARALLAX_MAX_VH = 8;

/**
 * Living backdrop of the dashboard: slow currents of light, an aurora ribbon, and a glow that
 * travels along the contour lines and follows the cursor. Only transforms are animated, and the
 * cards above it are not blurred, so it stays cheap to run all the time.
 */
export function DashboardBackdrop() {
  const linesRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let shift = 0;
    let pointer: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      shift = Math.min(window.scrollY * PARALLAX, (window.innerHeight * PARALLAX_MAX_VH) / 100);
      if (linesRef.current) linesRef.current.style.transform = `translate3d(0, ${-shift}px, 0)`;
      if (pointer && cursorRef.current) {
        cursorRef.current.style.opacity = '1';
        // The cursor light lives inside the shifted lines: add the shift back.
        cursorRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y + shift}px, 0)`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div aria-hidden className="dash-backdrop">
      <span className="dash-current dash-current-a" />
      <span className="dash-current dash-current-b" />
      <span className="dash-current dash-current-c" />
      <span className="dash-ribbon" />
      <div ref={linesRef} className="dash-lines">
        <span className="dash-lines-glow dash-lines-glow-a" />
        <span className="dash-lines-glow dash-lines-glow-b" />
        <span ref={cursorRef} className="dash-lines-cursor" />
      </div>
    </div>
  );
}
