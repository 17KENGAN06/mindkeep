/** Wide, tall desktop with a mouse. Phones and tablets keep normal page scroll. */
export const DESKTOP_SNAP_MQ =
  '(min-width: 1280px) and (min-height: 900px) and (hover: hover) and (pointer: fine)';

export function matchesDesktopSnap(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_SNAP_MQ).matches;
}
