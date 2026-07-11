
import { useStopwatchStore } from '../store/useStopwatchStore';
import { useStopwatch } from '../hooks/useStopwatch';
import { LapTable } from '../components/LapTable';

export function StopwatchView() {
  const store = useStopwatchStore();
  const elapsed = useStopwatch();

  const formatMainTimeParts = (ms: number) => {
    const totalDeciseconds = Math.floor(ms / 100);
    const h = Math.floor(totalDeciseconds / 36000);
    const m = Math.floor((totalDeciseconds % 36000) / 600);
    const s = Math.floor((totalDeciseconds % 600) / 10);
    const ds = totalDeciseconds % 10;
    
    return {
      gray: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:`,
      orangeMain: `${s.toString().padStart(2, '0')}`,
      orangeSmall: `.${ds}`
    };
  };

  const handleLap = () => {
    if (!store.isRunning) return;
    const previousLapsTotal = store.laps.reduce((acc, l) => acc + l.lapTime, 0);
    const currentLapTime = elapsed - previousLapsTotal;
    store.addLap(currentLapTime, elapsed);
  };

  const parts = formatMainTimeParts(elapsed);

  return (
    <div className="clock-view stopwatch-view">
      <div className="stopwatch-display">
        <h1>
          <span className="sw-gray">{parts.gray}</span>
          <span className="sw-orange">{parts.orangeMain}</span>
          <span className="sw-orange-small">{parts.orangeSmall}</span>
        </h1>
      </div>
      <div className="stopwatch-controls" style={{ gap: '48px', marginBottom: '48px' }}>
        {store.isRunning ? (
          <>
            <button className="clock-pill-btn" onClick={() => store.pauseStopwatch(elapsed)}>Pause</button>
            <button className="clock-pill-btn" onClick={handleLap}>Lap</button>
          </>
        ) : (
          <>
            <button className="clock-pill-btn" onClick={store.startStopwatch}>Start</button>
            <button className="clock-pill-btn" onClick={store.resetStopwatch} disabled={elapsed === 0}>Reset</button>
          </>
        )}
      </div>
      {store.laps.length > 0 && <LapTable laps={store.laps} />}
    </div>
  );
}
