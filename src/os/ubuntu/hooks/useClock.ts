import { useState, useEffect } from 'react';

/**
 * Real-time clock hook for the GNOME top bar.
 * Updates every second and returns a locale-aware formatted string.
 */
export function useClock(): string {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
}
