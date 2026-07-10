import React from 'react';
import { useStopwatchStore } from '../store/useStopwatchStore';
import { useStopwatch } from '../hooks/useStopwatch';
import { LapTable } from '../components/LapTable';

export function StopwatchView() {
  const store = useStopwatchStore();
  const elapsed = useStopwatch();

  const formatMainTime = (ms: number) => {
    const totalDeciseconds = Math.floor(ms / 100);
    const m = Math.floor(totalDeciseconds / 600);
    const s = Math.floor((totalDeciseconds % 600) / 10);
    const ds = totalDeciseconds % 10;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ds}`;
  };

  const handleLap = () => {
    if (!store.isRunning) return;
    const previousLapsTotal = store.laps.reduce((acc, l) => acc + l.lapTime, 0);
    const currentLapTime = elapsed - previousLapsTotal;
    store.addLap(currentLapTime, elapsed);
  };

  return (
    <div className="clock-view stopwatch-view">
      <div className="stopwatch-display">
        <h1>{formatMainTime(elapsed)}</h1>
      </div>
      <div className="stopwatch-controls">
        {store.isRunning ? (
          <>
            <button className="clock-btn clock-btn-pause" onClick={() => store.pauseStopwatch(elapsed)}>Pause</button>
            <button className="clock-btn clock-btn-lap" onClick={handleLap}>Lap</button>
          </>
        ) : (
          <>
            <button className="clock-btn clock-btn-start" onClick={store.startStopwatch}>Start</button>
            <button className="clock-btn clock-btn-reset" onClick={store.resetStopwatch} disabled={elapsed === 0}>Reset</button>
          </>
        )}
      </div>
      {store.laps.length > 0 && <LapTable laps={store.laps} />}
    </div>
  );
}
