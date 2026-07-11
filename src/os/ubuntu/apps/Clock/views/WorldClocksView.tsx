import { useState } from 'react';
import { useWorldClockStore } from '../store/useWorldClockStore';
import { AnalogClock } from '../components/AnalogClock';

export function WorldClocksView() {
  const POPULAR_CITIES = [
    { city: 'London', tz: 'Europe/London' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
    { city: 'Sydney', tz: 'Australia/Sydney' },
    { city: 'Paris', tz: 'Europe/Paris' },
    { city: 'Dubai', tz: 'Asia/Dubai' },
    { city: 'Los Angeles', tz: 'America/Los_Angeles' },
    { city: 'Hong Kong', tz: 'Asia/Hong_Kong' },
    { city: 'Singapore', tz: 'Asia/Singapore' },
    { city: 'Berlin', tz: 'Europe/Berlin' },
    { city: 'Moscow', tz: 'Europe/Moscow' },
    { city: 'Mumbai', tz: 'Asia/Kolkata' },
  ];

  const { clocks, addClock, removeClock } = useWorldClockStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCity, setSelectedCity] = useState(POPULAR_CITIES[0]);

  const handleAdd = () => {
    addClock({ city: selectedCity.city, timezone: selectedCity.tz });
    setShowAdd(false);
    setSelectedCity(POPULAR_CITIES[0]);
  };

  return (
    <div className="clock-view world-clocks-view">
      {clocks.length === 0 && !showAdd && (
        <div className="clock-empty-state">
          <div className="clock-empty-icon">
            <svg viewBox="0 0 24 24" width="128" height="128" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <button className="clock-empty-btn" onClick={() => setShowAdd(true)}>Add World Clock...</button>
        </div>
      )}

      {showAdd && (
        <div className="clock-modal-overlay">
          <div className="clock-add-form">
            <h2>Add World Clock</h2>
            <select 
              value={selectedCity.city}
              onChange={(e) => {
                const city = POPULAR_CITIES.find(c => c.city === e.target.value);
                if (city) setSelectedCity(city);
              }}
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid var(--color-border)', 
                background: 'var(--color-bg-input)', 
                color: 'var(--color-text-primary)',
                marginBottom: '16px'
              }}
            >
              {POPULAR_CITIES.map(c => (
                <option key={c.city} value={c.city}>{c.city} ({c.tz})</option>
              ))}
            </select>
            <div className="form-actions">
              <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>Cancel</button>
              <button className="clock-primary-btn" onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      <div className="clock-grid">
        {clocks.map(clock => {
          let timeStr = '';
          try {
            timeStr = new Intl.DateTimeFormat('en-US', { timeZone: clock.timezone, hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
          } catch(e) {}
          return (
            <div key={clock.id} className="clock-card">
              <AnalogClock timezone={clock.timezone} />
              <div className="clock-card-info">
                <h3>{clock.city}</h3>
                <p>{timeStr}</p>
                <button className="clock-delete-btn-small" onClick={() => removeClock(clock.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      
      {clocks.length > 0 && !showAdd && (
        <button className="clock-fab" onClick={() => setShowAdd(true)}>+</button>
      )}
    </div>
  );
}
