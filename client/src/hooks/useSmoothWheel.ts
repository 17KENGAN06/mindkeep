import { useEffect } from 'react';

/** How fast the page catches up with the wheel: a larger value feels heavier. */
const CATCH_UP_MS = 170;
/** Trackpads send tiny deltas and already glide; anything larger is a wheel notch. */
const MIN_WHEEL_DELTA = 16;

/**
 * An inner list under the pointer that can still move in this direction keeps the wheel.
 * One already at its end hands the wheel back to the page, so the page never gets stuck.
 */
function scrollsOnItsOwn(target: EventTarget | null, deltaY: number): boolean {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.scrollHeight > node.clientHeight + 1) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const canMove =
          deltaY > 0
            ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
            : node.scrollTop > 0;
        if (canMove) return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Page scroll with a soft inertia on the mouse wheel. Everything else stays native; the home
 * page's snap sections scroll inside their own element, so they are left alone too.
 */
export function useSmoothWheel(resetKey: string) {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    let target = window.scrollY;
    let current = target;
    /** Where the page really was after our last step. */
    let landed = target;
    let last = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const step = (now: number) => {
      // Something else moved the page (scrollbar drag, content above changed): follow it.
      // Compared with where the page actually was after our last step, so rounding to
      // device pixels does not count as a move.
      if (Math.abs(window.scrollY - landed) > 2) {
        current = window.scrollY;
        target = current;
        frame = 0;
        return;
      }
      const elapsed = Math.min(now - last, 50);
      last = now;
      current += (target - current) * (1 - Math.exp(-elapsed / CATCH_UP_MS));
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo({ top: current, behavior: 'instant' });
      landed = window.scrollY;
      frame = current === target ? 0 : requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.deltaMode === 0 && Math.abs(event.deltaY) < MIN_WHEEL_DELTA) return;
      // A locked page (open menu or dialog) and inner lists keep their own scrolling.
      if (document.body.style.overflow === 'hidden' || scrollsOnItsOwn(event.target, event.deltaY)) return;

      const pixels = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaY;
      // The page's real scroll range: clientHeight is the visible part the browser scrolls by.
      // innerHeight can be larger (zoom, scrollbars, browser bars), which stopped the wheel short
      // of the footer.
      const root = document.scrollingElement ?? document.documentElement;
      const max = Math.max(0, root.scrollHeight - root.clientHeight);
      // Resting at what we think is the end: let the browser take this notch. If the page can
      // still move (anything our range missed), it does; if not, nothing happens either way.
      // So the wheel can never get stuck short of the footer or the top.
      const atEdge = pixels > 0 ? window.scrollY >= max - 1 : window.scrollY <= 1;
      if (!frame && atEdge) return;
      if (!frame || Math.abs(window.scrollY - landed) > 2) {
        stop();
        current = window.scrollY;
        landed = current;
        target = current;
      }
      event.preventDefault();
      target = Math.min(max, Math.max(0, target + pixels));
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', stop);
    window.addEventListener('pointerdown', stop);
    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', stop);
      window.removeEventListener('pointerdown', stop);
    };
  }, [resetKey]);
}
