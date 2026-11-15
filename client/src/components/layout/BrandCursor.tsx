import { useEffect, useRef } from 'react';

/**
 * Site cursor in the app's accent colour: a dot that sits exactly under the pointer and a ring
 * that follows it with a little inertia. Over links and buttons the ring grows and fills; over
 * text fields the system I-beam comes back. Only for a mouse (hover + fine pointer); touch
 * devices keep the system cursor. With reduced motion the ring sits on the dot, without inertia
 * or animations.
 */
const QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const ROOT_CLASS = 'has-brand-cursor';
const STILL_CLASS = 'brand-cursor-still';
const INTERACTIVE =
  'a, button, summary, label, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], [data-cursor="hover"]';
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"], [contenteditable=""]';
/** How quickly the ring catches up per frame (0–1). */
const FOLLOW = 0.2;

export function BrandCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION);
    let stop: (() => void) | null = null;

    const start = () => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (!dot || !ring) return () => undefined;

      const root = document.documentElement;
      const still = reduced.matches;
      const follow = still ? 1 : FOLLOW;
      root.classList.add(ROOT_CLASS);
      root.classList.toggle(STILL_CLASS, still);

      let x = -100;
      let y = -100;
      let ringX = -100;
      let ringY = -100;
      let frame = 0;
      let shown = false;

      const setState = (name: string, on: boolean) => {
        dot.dataset[name] = on ? 'true' : 'false';
        ring.dataset[name] = on ? 'true' : 'false';
      };

      const tick = () => {
        ringX += (x - ringX) * follow;
        ringY += (y - ringY) * follow;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        if (Math.abs(x - ringX) > 0.1 || Math.abs(y - ringY) > 0.1) {
          frame = requestAnimationFrame(tick);
        } else {
          frame = 0;
        }
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        x = event.clientX;
        y = event.clientY;
        if (!shown) {
          // First move: jump the ring to the pointer instead of flying in from the corner.
          ringX = x;
          ringY = y;
          shown = true;
          setState('visible', true);
        }
        if (!frame) frame = requestAnimationFrame(tick);
      };

      const onOver = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target : null;
        const text = Boolean(target?.closest(TEXT_FIELD));
        setState('text', text);
        setState('hover', !text && Boolean(target?.closest(INTERACTIVE)));
      };

      const onDown = () => setState('pressed', true);
      const onUp = () => setState('pressed', false);
      // Leaving the window (or entering an iframe) hides it until the mouse comes back.
      const onLeave = () => {
        shown = false;
        setState('visible', false);
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onLeave);

      return () => {
        cancelAnimationFrame(frame);
        root.classList.remove(ROOT_CLASS, STILL_CLASS);
        setState('visible', false);
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        document.documentElement.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('blur', onLeave);
      };
    };

    const sync = () => {
      stop?.();
      stop = media.matches ? start() : null;
    };
    sync();
    media.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
      stop?.();
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="brand-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="brand-cursor-dot" aria-hidden="true" />
    </>
  );
}
