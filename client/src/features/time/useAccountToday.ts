import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { dateKeyInZone } from '@/utils/date';

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Helsinki';
  } catch {
    return 'Europe/Helsinki';
  }
}

/**
 * "Today" in the account time zone (User.timezone), the same zone the server and the mobile
 * app use. Rolls over at midnight: checked every minute and when the tab becomes visible or
 * regains focus; re-renders only when the day changes.
 */
export function useAccountToday() {
  const { user } = useAuth();
  const timeZone = user?.timezone || detectBrowserTimezone();
  const [now, setNow] = useState(() => new Date());
  const today = dateKeyInZone(now, timeZone);

  useEffect(() => {
    const tick = () => {
      const next = new Date();
      // Keep the same Date (no re-render) unless the day in the account zone changed.
      setNow((current) =>
        dateKeyInZone(next, timeZone) === dateKeyInZone(current, timeZone) ? current : next,
      );
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [timeZone]);

  return {
    timeZone,
    today,
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  };
}

/** Runs `onRollover(previous, next)` once each time `today` changes (e.g. at midnight). */
export function useTodayRollover(today: string, onRollover: (previous: string, next: string) => void) {
  const previous = useRef(today);
  const callback = useRef(onRollover);

  // Keep the latest callback without touching refs during render.
  useEffect(() => {
    callback.current = onRollover;
  });

  useEffect(() => {
    if (previous.current === today) return;
    const before = previous.current;
    previous.current = today;
    callback.current(before, today);
  }, [today]);
}
