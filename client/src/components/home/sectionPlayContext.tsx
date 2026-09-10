import { createContext, useContext, type ReactNode } from 'react';

const SectionPlayContext = createContext(false);

export function SectionPlayProvider({
  play,
  children,
}: {
  play: boolean;
  children: ReactNode;
}) {
  return <SectionPlayContext.Provider value={play}>{children}</SectionPlayContext.Provider>;
}

export function useSectionPlay(): boolean {
  return useContext(SectionPlayContext);
}
