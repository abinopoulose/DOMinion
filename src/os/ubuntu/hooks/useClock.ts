import { useState, useEffect } from 'react';
import { useSettingsStore } from '../apps/Settings/store/useSettingsStore';

/**
 * Real-time clock hook for the GNOME top bar.
 * Updates every second and returns a locale-aware formatted string.
 */
export function useClock(): string {
  const [now, setNow] = useState(new Date());
  
  const {
    clockTimeFormat,
    clockShowWeekday,
    clockShowDate,
    clockShowSeconds
  } = useSettingsStore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: clockTimeFormat === 'AM / PM',
  };

  if (clockShowSeconds) {
    options.second = '2-digit';
  }

  if (clockShowDate) {
    options.month = 'short';
    options.day = 'numeric';
  }

  if (clockShowWeekday) {
    options.weekday = 'short';
  }

  // Format the date
  let formatted = new Intl.DateTimeFormat('en-US', options).format(now);
  
  // Custom cleanup because Intl.DateTimeFormat can inject commas we might not want
  if (clockShowDate && !clockShowWeekday) {
    // If just month/day and time, it usually puts a comma between date and time "Jul 6, 23:49". Let's remove the comma.
    formatted = formatted.replace(',', '');
  }

  return formatted;
}
