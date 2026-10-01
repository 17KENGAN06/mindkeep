import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type SectionNavProps = {
  sectionIds: string[];
  labels: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

const HIDE_MS = 2600;

function useAutoHideNav(activeId: string) {
  const [visible, setVisible] = useState(true);
  const [pinned, setPinned] = useState(false);
  const timerRef = useRef<number | null>(null);
  const pinnedRef = useRef(false);
  pinnedRef.current = pinned;

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleHide = useCallback(() => {
    clearTimer();
    if (pinnedRef.current) return;
    timerRef.current = window.setTimeout(() => {
      if (pinnedRef.current) return;
      setVisible(false);
      timerRef.current = null;
    }, HIDE_MS);
  }, []);

  const reveal = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    setVisible(true);
    scheduleHide();
  }, [activeId, scheduleHide]);

  useEffect(() => {
    if (pinned) {
      setVisible(true);
      clearTimer();
      return;
    }
    scheduleHide();
  }, [pinned, scheduleHide]);

  useEffect(() => {
    const nearNav = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return false;
      const width = window.innerWidth;
      if (width >= 1280) return event.clientX > width - 80;
      return false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (nearNav(event)) reveal();
    };

    const onIntent = () => reveal();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('wheel', onIntent, { passive: true });
    window.addEventListener('touchstart', onIntent, { passive: true });
    return () => {
      clearTimer();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('wheel', onIntent);
      window.removeEventListener('touchstart', onIntent);
    };
  }, [reveal]);

  const pin = () => setPinned(true);
  const unpin = () => setPinned(false);

  return {
    visible,
    chromeProps: {
      onPointerEnter: pin,
      onPointerLeave: unpin,
      onFocusCapture: pin,
      onBlurCapture: (event: { currentTarget: EventTarget & Element; relatedTarget: EventTarget | null }) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          unpin();
        }
      },
    },
  };
}

function SectionDots({
  sectionIds,
  labels,
  activeId,
  onSelect,
  showSideLabels,
}: SectionNavProps & { showSideLabels: boolean }) {
  return (
    <ul className={`m-0 flex list-none p-0 ${showSideLabels ? 'flex-col gap-1' : 'flex-row gap-0.5'}`}>
      {sectionIds.map((id, index) => {
        const active = id === activeId;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={`pointer-events-auto group flex items-center ${showSideLabels ? 'gap-3' : 'justify-center'}`}
              aria-current={active ? 'true' : undefined}
              aria-label={labels[index]}
            >
              {showSideLabels ? (
                <span
                  className={`font-display max-w-0 overflow-hidden text-[10px] tracking-[0.18em] whitespace-nowrap text-muted uppercase opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100 ${
                    active ? 'max-w-40 text-brand-500 opacity-100' : ''
                  }`}
                >
                  {labels[index]}
                </span>
              ) : null}
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center sm:h-8 sm:w-8">
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    active
                      ? 'h-3 w-3 bg-brand-500 shadow-[0_0_12px_rgba(142,239,180,0.65)] outline outline-2 outline-offset-2 outline-brand-400/70'
                      : 'h-2 w-2 bg-line group-hover:bg-brand-400/70'
                  }`}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NavShell({
  visible,
  className,
  hiddenClassName,
  children,
  chromeProps,
}: {
  visible: boolean;
  className: string;
  hiddenClassName: string;
  children: ReactNode;
  chromeProps: ReturnType<typeof useAutoHideNav>['chromeProps'];
}) {
  return (
    <nav className={className} aria-label="Sections">
      <div
        {...chromeProps}
        className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:transition-opacity ${
          visible ? 'pointer-events-auto opacity-100' : `pointer-events-none opacity-0 ${hiddenClassName}`
        }`}
      >
        {children}
      </div>
    </nav>
  );
}

export function SectionNav({ sectionIds, labels, activeId, onSelect }: SectionNavProps) {
  const activeIndex = Math.max(0, sectionIds.indexOf(activeId));
  const count = sectionIds.length;
  const last = Math.max(count - 1, 1);
  const progress = activeIndex / last;
  const { visible, chromeProps } = useAutoHideNav(activeId);
  const dots = {
    sectionIds,
    labels,
    activeId,
    onSelect,
  };

  return (
    <>
      <NavShell
        visible={visible}
        chromeProps={chromeProps}
        className="pointer-events-none fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 xl:flex"
        hiddenClassName="translate-x-3"
      >
        <div className="relative rounded-[1.75rem] border border-line/70 bg-panel/60 px-3 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <SectionDots {...dots} showSideLabels />
          <div
            className="pointer-events-none absolute top-4 bottom-4 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-line/50"
            style={{ right: 'calc(0.75rem + 0.875rem)' }}
            aria-hidden
          >
            <div
              className="w-full rounded-full bg-gradient-to-b from-brand-300 via-brand-500 to-brand-600 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ height: `${Math.max(progress * 100, 6)}%` }}
            />
          </div>
        </div>
      </NavShell>
    </>
  );
}
