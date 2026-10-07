import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { detectDeviceTimezone } from '../../config/timezones';
import { dateKeyInZone } from '../../utils/date';
import { useAuth } from '../auth/useAuth';

/**
 * "Today" in the account time zone (User.timezone), the same zone the server uses for
 * reviews, tasks and statistics. Rolls over at midnight: checked every minute while the
 * app is open and whenever it returns to the foreground; re-renders only when the day changes.
 */
export function useAccountToday() {
  const { user } = useAuth();
  const timeZone = user?.timezone || detectDeviceTimezone();
  const [now, setNow] = useState(() => new Date());
  const today = dateKeyInZone(now, timeZone);
  const todayRef = useRef(today);
  todayRef.current = today;

  useEffect(() => {
    const tick = () => {
      const next = new Date();
      if (dateKeyInZone(next, timeZone) !== todayRef.current) setNow(next);
    };
    const timer = setInterval(tick, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
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
  callback.current = onRollover;

  useEffect(() => {
    if (previous.current === today) return;
    const before = previous.current;
    previous.current = today;
    callback.current(before, today);
  }, [today]);
}
