import React, { useEffect, useState } from 'react';

export function AnalogClock({ timezone }: { timezone?: string }) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  let d = time;
  if (timezone) {
    try {
      const tzStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      }).format(time);
      d = new Date(tzStr);
    } catch (e) {
      // Ignore
    }
  }

  const seconds = d.getSeconds();
  const minutes = d.getMinutes();
  const hours = d.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = (hours + minutes / 60) * 30;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="95" fill="var(--clock-bg, #242424)" stroke="var(--clock-border, #3a3a3a)" strokeWidth="4"/>
      
      {[...Array(12)].map((_, i) => (
        <line key={i} x1="100" y1="15" x2="100" y2="25" stroke="#888" strokeWidth="2" transform={`rotate(${i * 30} 100 100)`} />
      ))}
      
      <line x1="100" y1="100" x2="100" y2="45" stroke="#ccc" strokeWidth="6" strokeLinecap="round" transform={`rotate(${hourDeg} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="20" stroke="#ccc" strokeWidth="4" strokeLinecap="round" transform={`rotate(${minuteDeg} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="20" stroke="var(--color-accent, #E95420)" strokeWidth="2" strokeLinecap="round" transform={`rotate(${secondDeg} 100 100)`} />
      
      <circle cx="100" cy="100" r="4" fill="var(--color-accent, #E95420)" />
    </svg>
  );
}
