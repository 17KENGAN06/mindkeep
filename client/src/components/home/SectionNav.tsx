type SectionNavProps = {
  sectionIds: string[];
  labels: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

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

export function SectionNav({ sectionIds, labels, activeId, onSelect }: SectionNavProps) {
  const activeIndex = Math.max(0, sectionIds.indexOf(activeId));
  const count = sectionIds.length;
  const last = Math.max(count - 1, 1);
  const progress = activeIndex / last;
  const activeLabel = labels[activeIndex] ?? '';
  const dots = {
    sectionIds,
    labels,
    activeId,
    onSelect,
  };

  return (
    <>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:flex xl:hidden"
        aria-label="Sections"
      >
        <div className="relative flex flex-col items-center rounded-[1.5rem] border border-line/70 bg-panel/70 px-4 pt-2 pb-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="font-display mb-0.5 max-w-[16rem] truncate text-[10px] tracking-[0.18em] text-brand-500 uppercase">
            {activeLabel}
          </p>
          <div className="relative">
            <div
              className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-line/50"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-300 via-brand-500 to-brand-600 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${Math.max(progress * 100, 6)}%` }}
              />
            </div>
            <SectionDots {...dots} showSideLabels={false} />
          </div>
        </div>
      </nav>

      <nav
        className="pointer-events-none fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 xl:flex"
        aria-label="Sections"
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
      </nav>
    </>
  );
}
