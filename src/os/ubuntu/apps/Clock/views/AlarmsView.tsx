import { useState } from 'react';
import { useAlarmStore } from '../store/useAlarmStore';
import { AlarmItem } from '../components/AlarmItem';

export function AlarmsView() {
  const { alarms, addAlarm, toggleAlarm, deleteAlarm } = useAlarmStore();
  const [showAdd, setShowAdd] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('Alarm');

  const handleAdd = () => {
    addAlarm({ hour, minute, label, active: true, repeatDays: [] });
    setShowAdd(false);
  };

  return (
    <div className="clock-view alarms-view">
      {alarms.length === 0 && !showAdd && (
        <div className="clock-empty-state">
          <div className="clock-empty-icon">
            <svg viewBox="0 0 24 24" width="128" height="128" fill="currentColor">
              <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
            </svg>
          </div>
          <button className="clock-empty-btn" onClick={() => setShowAdd(true)}>Add Alarm...</button>
        </div>
      )}

      {showAdd && (
        <div className="clock-modal-overlay">
          <div className="clock-add-form">
            <h2>Add Alarm</h2>
            <div className="time-inputs">
              <input type="number" min="0" max="23" value={hour} onChange={e => setHour(Number(e.target.value))} />
              <span>:</span>
              <input type="number" min="0" max="59" value={minute} onChange={e => setMinute(Number(e.target.value))} />
            </div>
            <input type="text" placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} />
            <div className="form-actions">
              <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>Cancel</button>
              <button className="clock-primary-btn" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="alarms-list">
        {alarms.map(alarm => (
          <AlarmItem 
            key={alarm.id} 
            alarm={alarm} 
            onToggle={(a) => toggleAlarm(alarm.id, a)} 
            onDelete={() => deleteAlarm(alarm.id)} 
          />
        ))}
      </div>
      
      {alarms.length > 0 && !showAdd && (
        <button className="clock-fab" onClick={() => setShowAdd(true)}>+</button>
      )}
    </div>
  );
}
