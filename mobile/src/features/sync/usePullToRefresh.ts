import { useCallback, useRef, useState } from 'react';

type Refetchable = { refetch: (options?: { cancelRefetch?: boolean }) => Promise<unknown> };

/**
 * Manual pull-to-refresh: refetch now (ignores staleTime), join a request that is already
 * running instead of starting another, and never stack pulls. `refreshing` tracks only the
 * user's pull, so background refreshes do not show the spinner.
 */
export function usePullToRefresh(...queries: Refetchable[]) {
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);
  const latest = useRef(queries);
  latest.current = queries;

  const onRefresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      await Promise.all(latest.current.map((query) => query.refetch({ cancelRefetch: false })));
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  return { refreshing, onRefresh };
}
