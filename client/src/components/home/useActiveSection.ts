import { useEffect, useMemo, useState } from 'react';

export function useActiveSection(sectionIds: string[], root: HTMLElement | null) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds]);

  useEffect(() => {
    if (!root || sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => root.querySelector(`#${CSS.escape(id)}`))
      .filter((el): el is Element => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) {
          setActiveId(top.target.id);
        }
      },
      {
        root,
        threshold: [0.35, 0.55, 0.7],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // idsKey stabilizes identity when the array is recreated with the same ids
  }, [root, idsKey, sectionIds]);

  return activeId;
}
