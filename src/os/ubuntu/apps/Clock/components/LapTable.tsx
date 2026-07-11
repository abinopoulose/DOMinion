
import type { Lap } from '../store/useStopwatchStore';

export function LapTable({ laps }: { laps: Lap[] }) {
  const formatTime = (ms: number) => {
    const totalDeciseconds = Math.floor(ms / 100);
    const h = Math.floor(totalDeciseconds / 36000);
    const m = Math.floor((totalDeciseconds % 36000) / 600);
    const s = Math.floor((totalDeciseconds % 600) / 10);
    const ds = totalDeciseconds % 10;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ds}`;
  };

  return (
    <div className="clock-lap-list">
      {laps.map((lap, index) => (
        <div key={lap.id} className="clock-lap-row">
          <div className="lap-time-main">{formatTime(lap.totalTime)}</div>
          <div className="lap-time-diff">-{formatTime(lap.lapTime)}</div>
          <div className="lap-name">Lap {laps.length - index}</div>
        </div>
      ))}
    </div>
  );
}
