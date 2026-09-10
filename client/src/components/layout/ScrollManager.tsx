import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function resetWindowScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function resetSnapScrollers() {
  document.querySelectorAll<HTMLElement>('[data-section-snap="true"]').forEach((node) => {
    node.scrollTop = 0;
  });
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
  return true;
}

/**
 * Always open navigated pages (and same-route link clicks) from the top on mobile/desktop.
 * Hash links land at the start of the target block.
 */
export function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (location.hash) {
      // Wait a frame so the destination route has painted.
      const frame = window.requestAnimationFrame(() => {
        if (!scrollToHash(location.hash)) {
          resetWindowScroll();
          resetSnapScrollers();
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    resetWindowScroll();
    resetSnapScrollers();
    return undefined;
  }, [location.pathname, location.search, location.hash, location.key]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const samePath =
        url.pathname === location.pathname && url.search === (location.search || '');

      if (!samePath) return;

      if (url.hash) {
        // Let the browser/hash effect handle block start alignment after navigation key update.
        window.requestAnimationFrame(() => {
          scrollToHash(url.hash);
        });
        return;
      }

      resetWindowScroll();
      resetSnapScrollers();

      // Home landing: also jump to the first section if snap scroller exists.
      const hero = document.getElementById('hero');
      if (hero && url.pathname === '/') {
        hero.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [location.pathname, location.search]);

  return null;
}
