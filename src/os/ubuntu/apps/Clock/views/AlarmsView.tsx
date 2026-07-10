import React, { useState } from 'react';
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
          <div className="clock-empty-icon">⏰</div>
          <h2>No Alarms</h2>
          <button className="clock-primary-btn" onClick={() => setShowAdd(true)}>Add Alarm</button>
        </div>
      )}

      {showAdd && (
        <div className="clock-add-form">
          <div className="time-inputs">
            <input type="number" min="0" max="23" value={hour} onChange={e => setHour(Number(e.target.value))} />
            <span>:</span>
            <input type="number" min="0" max="59" value={minute} onChange={e => setMinute(Number(e.target.value))} />
          </div>
          <input type="text" placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} />
          <div className="form-actions">
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="clock-primary-btn" onClick={handleAdd}>Save</button>
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
