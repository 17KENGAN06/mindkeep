import { createContext, useContext } from 'react';

/** Opens the bar's "+" sheet; `task: true` opens it with the task form already unfolded. */
export type OpenQuickAdd = (options?: { task?: boolean }) => void;

export const QuickAddContext = createContext<OpenQuickAdd>(() => undefined);

export function useOpenQuickAdd(): OpenQuickAdd {
  return useContext(QuickAddContext);
}
