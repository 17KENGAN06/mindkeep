import { useEffect, useRef, useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

/** The spinner stays at least this long after a pull, so it never flickers in and out. */
const MIN_SPIN_MS = 600;

type PullRefreshControlProps = Omit<RefreshControlProps, 'refreshing'> & {
  /** The screen's data is reloading (for any reason). */
  busy: boolean;
};

/**
 * Pull-to-refresh whose spinner shows only for the user's own pull. Background reloads — the
 * refetch after adding or ticking something — no longer slide the spinner in and push the whole
 * screen down and back. Drop-in for RefreshControl: `busy` replaces `refreshing`.
 */
export function PullRefreshControl({ busy, onRefresh, ...rest }: PullRefreshControlProps) {
  const [pulled, setPulled] = useState(false);
  const [minElapsed, setMinElapsed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Done once the reload has finished and the spinner has had its minimum time.
  useEffect(() => {
    if (pulled && minElapsed && !busy) setPulled(false);
  }, [busy, minElapsed, pulled]);

  const start = () => {
    setPulled(true);
    setMinElapsed(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMinElapsed(true), MIN_SPIN_MS);
    onRefresh?.();
  };

  return <RefreshControl {...rest} refreshing={pulled} onRefresh={start} />;
}
