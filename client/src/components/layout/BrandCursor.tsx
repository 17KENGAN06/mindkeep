import { useEffect, useRef } from 'react';

/**
 * Site cursor in the app's accent colour: a dot inside a thin ring. Both live in one element
 * that sits exactly under the pointer, so they can never drift apart. Over links and buttons the
 * ring smoothly tightens around the dot; over text fields the dot stretches into a slim accent
 * caret. Only for a mouse (hover + fine pointer) — touch devices keep the system cursor.
 */
const QUERY = '(hover: hover) and (pointer: fine)';
const ROOT_CLASS = 'has-brand-cursor';
const INTERACTIVE =
  'a, button, summary, label, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], [data-cursor="hover"]';
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"], [contenteditable=""]';

export function BrandCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    let stop: (() => void) | null = null;

    const start = () => {
      const cursor = cursorRef.current;
      if (!cursor) return () => undefined;

      const root = document.documentElement;
      root.classList.add(ROOT_CLASS);

      let x = -100;
      let y = -100;
      let frame = 0;

      const setState = (name: string, on: boolean) => {
        cursor.dataset[name] = on ? 'true' : 'false';
      };

      const paint = () => {
        frame = 0;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        x = event.clientX;
        y = event.clientY;
        setState('visible', true);
        if (!frame) frame = requestAnimationFrame(paint);
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
      const onLeave = () => setState('visible', false);

      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onLeave);

      return () => {
        cancelAnimationFrame(frame);
        root.classList.remove(ROOT_CLASS);
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
    return () => {
      media.removeEventListener('change', sync);
      stop?.();
    };
  }, []);

  return (
    <div ref={cursorRef} className="brand-cursor" aria-hidden="true">
      <span className="brand-cursor-ring" />
      <span className="brand-cursor-dot" />
    </div>
  );
}
