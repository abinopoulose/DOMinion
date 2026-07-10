import React from 'react';
import type { Alarm } from '../store/useAlarmStore';

interface AlarmItemProps {
  alarm: Alarm;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

export function AlarmItem({ alarm, onToggle, onDelete }: AlarmItemProps) {
  const ampm = alarm.hour >= 12 ? 'PM' : 'AM';
  const displayHour = alarm.hour % 12 || 12;
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const repeatStr = alarm.repeatDays.map(d => days[d]).join(', ') || 'Once';

  return (
    <div className="clock-alarm-item">
      <div className="clock-alarm-info">
        <div className="clock-alarm-time">
          <span className="time">{displayHour}:{alarm.minute.toString().padStart(2, '0')}</span>
          <span className="ampm">{ampm}</span>
        </div>
        <div className="clock-alarm-meta">
          <span>{alarm.label}</span>
          <span className="dot">•</span>
          <span>{repeatStr}</span>
        </div>
      </div>
      <div className="clock-alarm-controls">
        <label className="clock-switch">
          <input type="checkbox" checked={alarm.active} onChange={(e) => onToggle(e.target.checked)} />
          <span className="slider round"></span>
        </label>
        <button className="clock-delete-btn" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}
