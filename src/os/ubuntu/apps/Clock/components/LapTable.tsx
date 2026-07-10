import React from 'react';
import type { Lap } from '../store/useStopwatchStore';

export function LapTable({ laps }: { laps: Lap[] }) {
  const formatTime = (ms: number) => {
    const totalDeciseconds = Math.floor(ms / 100);
    const m = Math.floor(totalDeciseconds / 600);
    const s = Math.floor((totalDeciseconds % 600) / 10);
    const ds = totalDeciseconds % 10;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ds}`;
  };

  return (
    <div className="clock-lap-table-container">
      <table className="clock-lap-table">
        <thead>
          <tr>
            <th>Lap</th>
            <th>Lap Time</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap, index) => (
            <tr key={lap.id}>
              <td>{laps.length - index}</td>
              <td>{formatTime(lap.lapTime)}</td>
              <td>{formatTime(lap.totalTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
