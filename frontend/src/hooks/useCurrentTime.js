/**
 * Re-renders on an interval so past slots update without a page refresh.
 */
import { useState, useEffect } from 'react';

export function useCurrentTime(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
