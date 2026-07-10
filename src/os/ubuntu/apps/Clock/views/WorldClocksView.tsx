import React, { useState } from 'react';
import { useWorldClockStore } from '../store/useWorldClockStore';
import { AnalogClock } from '../components/AnalogClock';

export function WorldClocksView() {
  const { clocks, addClock, removeClock } = useWorldClockStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newTz, setNewTz] = useState('Europe/London');

  const handleAdd = () => {
    addClock({ city: newCity || newTz, timezone: newTz });
    setShowAdd(false);
    setNewCity('');
  };

  return (
    <div className="clock-view world-clocks-view">
      {clocks.length === 0 && !showAdd && (
        <div className="clock-empty-state">
          <div className="clock-empty-icon">🌍</div>
          <h2>No World Clocks</h2>
          <button className="clock-primary-btn" onClick={() => setShowAdd(true)}>Add World Clock</button>
        </div>
      )}

      {showAdd && (
        <div className="clock-add-form">
          <input type="text" placeholder="City Name" value={newCity} onChange={e => setNewCity(e.target.value)} />
          <input type="text" placeholder="Timezone (e.g. Europe/London)" value={newTz} onChange={e => setNewTz(e.target.value)} />
          <div className="form-actions">
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="clock-primary-btn" onClick={handleAdd}>Add</button>
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
