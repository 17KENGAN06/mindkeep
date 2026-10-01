import { useCallback, useEffect, useRef, useState } from 'react';

const WHEEL_THRESHOLD = 40;
const TOUCH_THRESHOLD = 48;
const LOCK_MS = 900;

function lastSectionRange(root: HTMLElement, lastId: string) {
  const el = root.querySelector(`#${CSS.escape(lastId)}`) as HTMLElement | null;
  if (!el) return null;
  const start = el.offsetTop;
  const end = start + el.offsetHeight;
  const view = root.clientHeight;
  return {
    start,
    overflow: end > start + view + 8,
    maxScroll: Math.max(start, end - view),
  };
}

/**
 * Full-page section snap: one section per wheel/swipe/key gesture.
 * Native CSS scroll-snap alone often fails on Windows trackpads.
 */
export function useSectionSnapScroll(sectionIds: string[], root: HTMLElement | null) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  const [snapEnabled, setSnapEnabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  const indexRef = useRef(0);
  const lockedRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelAcc = useRef(0);
  const idsRef = useRef(sectionIds);

  useEffect(() => {
    idsRef.current = sectionIds;
  }, [sectionIds]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setSnapEnabled(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const clearLockTimer = () => {
    if (lockTimerRef.current != null) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  };

  const lockBriefly = useCallback(() => {
    lockedRef.current = true;
    clearLockTimer();
    lockTimerRef.current = window.setTimeout(() => {
      lockedRef.current = false;
      wheelAcc.current = 0;
      lockTimerRef.current = null;
    }, LOCK_MS);
  }, []);

  const goToIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = 'smooth') => {
      if (!root) return;
      const ids = idsRef.current;
      if (ids.length === 0) return;

      const clamped = Math.max(0, Math.min(ids.length - 1, nextIndex));
      const id = ids[clamped];
      if (!id) return;

      const el = root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
      if (!el) return;

      indexRef.current = clamped;
      setActiveId(id);
      lockBriefly();

      const desktopSnap =
        typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

      if (desktopSnap) {
        // Desktop: sections live inside the snap scroller.
        root.scrollTo({ top: el.offsetTop, behavior });
      } else {
        // Mobile: the document scrolls — always align the block to the top of the viewport.
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top), behavior });
      }
    },
    [root, lockBriefly],
  );

  const goToSection = useCallback(
    (id: string) => {
      const index = idsRef.current.indexOf(id);
      if (index < 0) return;
      goToIndex(index);
    },
    [goToIndex],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      if (lockedRef.current) return;
      goToIndex(indexRef.current + direction);
    },
    [goToIndex],
  );

  const nearestIndex = useCallback(() => {
    if (!root) return 0;
    const ids = idsRef.current;
    const top = root.scrollTop;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    ids.forEach((id, index) => {
      const el = root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
      if (!el) return;
      const dist = Math.abs(el.offsetTop - top);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, [root]);

  useEffect(() => {
    if (!root || sectionIds.length === 0 || snapEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const id = (visible.target as HTMLElement).id;
        const index = idsRef.current.indexOf(id);
        if (index < 0) return;
        indexRef.current = index;
        setActiveId(id);
      },
      {
        root: null,
        rootMargin: '-42% 0px -42% 0px',
        threshold: 0,
      },
    );

    idsRef.current.forEach((id) => {
      const section = root.querySelector(`#${CSS.escape(id)}`);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [root, sectionIds.length, snapEnabled]);

  useEffect(() => {
    if (!root || sectionIds.length === 0 || !snapEnabled) return;

    goToIndex(nearestIndex() || 0, 'auto');

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-allow-scroll="true"]')) return;

      const ids = idsRef.current;
      const lastIndex = ids.length - 1;
      const lastId = ids[lastIndex];
      if (indexRef.current === lastIndex && lastId) {
        const range = lastSectionRange(root, lastId);
        if (range?.overflow) {
          const top = root.scrollTop;
          if (event.deltaY > 0 && top < range.maxScroll - 4) return;
          if (event.deltaY < 0 && top > range.start + 4) return;
        }
      }

      event.preventDefault();
      if (lockedRef.current) return;

      wheelAcc.current += event.deltaY;
      if (Math.abs(wheelAcc.current) < WHEEL_THRESHOLD) return;

      const direction = wheelAcc.current > 0 ? 1 : -1;
      wheelAcc.current = 0;
      step(direction);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY.current == null) return;
      const ids = idsRef.current;
      const lastIndex = ids.length - 1;
      const lastId = ids[lastIndex];
      if (indexRef.current === lastIndex && lastId) {
        const range = lastSectionRange(root, lastId);
        if (range?.overflow) {
          const top = root.scrollTop;
          const y = event.touches[0]?.clientY ?? 0;
          const goingDown = touchStartY.current - y > 0;
          if (goingDown && top < range.maxScroll - 4) return;
          if (!goingDown && top > range.start + 4) return;
        }
      }
      if (Math.abs((event.touches[0]?.clientY ?? 0) - touchStartY.current) > 8) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current == null || lockedRef.current) {
        touchStartY.current = null;
        return;
      }
      const endY = event.changedTouches[0]?.clientY;
      if (endY == null) {
        touchStartY.current = null;
        return;
      }
      const delta = touchStartY.current - endY;
      touchStartY.current = null;

      const ids = idsRef.current;
      const lastIndex = ids.length - 1;
      const lastId = ids[lastIndex];
      if (indexRef.current === lastIndex && lastId) {
        const range = lastSectionRange(root, lastId);
        if (range?.overflow && root.scrollTop > range.start + 4) return;
      }

      if (Math.abs(delta) < TOUCH_THRESHOLD) return;
      step(delta > 0 ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (lockedRef.current) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ids = idsRef.current;
      const lastIndex = ids.length - 1;
      const lastId = ids[lastIndex];
      const range = lastId ? lastSectionRange(root, lastId) : null;
      const inLastOverflow =
        indexRef.current === lastIndex && range?.overflow && root.scrollTop > range.start + 4;

      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        if (inLastOverflow) return;
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        if (inLastOverflow) return;
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goToIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goToIndex(idsRef.current.length - 1);
      }
    };

    let scrollIdle: number | null = null;
    const onScroll = () => {
      if (lockedRef.current) return;
      const ids = idsRef.current;
      const lastIndex = ids.length - 1;
      const lastId = ids[lastIndex];
      if (lastId) {
        const range = lastSectionRange(root, lastId);
        if (range && root.scrollTop > range.start + 40) {
          indexRef.current = lastIndex;
          setActiveId(lastId);
          return;
        }
      }
      if (scrollIdle != null) window.clearTimeout(scrollIdle);
      scrollIdle = window.setTimeout(() => {
        if (lockedRef.current) return;
        goToIndex(nearestIndex());
      }, 80);
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearLockTimer();
      if (scrollIdle != null) window.clearTimeout(scrollIdle);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [root, sectionIds.length, snapEnabled, goToIndex, step, nearestIndex]);

  return { activeId, goToSection };
}
