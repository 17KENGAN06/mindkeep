type SectionNavProps = {
  sectionIds: string[];
  labels: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SectionNav({ sectionIds, labels, activeId, onSelect }: SectionNavProps) {
  const activeIndex = Math.max(0, sectionIds.indexOf(activeId));
  const count = sectionIds.length;
  const last = Math.max(count - 1, 1);
  const progress = activeIndex / last;

  return (
    <nav
      className="pointer-events-none fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 md:flex"
      aria-label="Sections"
    >
      <div className="relative rounded-[1.75rem] border border-line/70 bg-panel/60 px-3 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {sectionIds.map((id, index) => {
            const active = id === activeId;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className="pointer-events-auto group flex items-center gap-3"
                  aria-current={active ? 'true' : undefined}
                  aria-label={labels[index]}
                >
                  <span
                    className={`font-display max-w-0 overflow-hidden text-[10px] tracking-[0.18em] whitespace-nowrap text-muted uppercase opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100 ${
                      active ? 'max-w-40 text-brand-500 opacity-100' : ''
                    }`}
                  >
                    {labels[index]}
                  </span>
                  {/* Fixed square keeps every dot on the same vertical axis */}
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center">
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

        {/* Track centered on the 28px dot column (right padding 12px + half of 28px) */}
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
  );
}
