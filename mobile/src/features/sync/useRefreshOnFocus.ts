import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

/**
 * Screens stay mounted in tabs and stacks, so returning to one does not reload it.
 * On every focus after the first, refetch this screen's data — only queries that are
 * displayed and older than their staleTime, so quick switches cost nothing.
 */
export function useRefreshOnFocus(...prefixes: string[]): void {
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);
  const keys = prefixes.join('|');

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      for (const prefix of keys.split('|')) {
        void queryClient.refetchQueries({ queryKey: [prefix], type: 'active', stale: true });
      }
    }, [keys, queryClient]),
  );
}
