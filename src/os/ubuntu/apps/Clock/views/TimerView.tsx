import React, { useState } from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { useTimer } from '../hooks/useTimer';

export function TimerView() {
  const store = useTimerStore();
  const remaining = useTimer();
  
  const [inputH, setInputH] = useState(0);
  const [inputM, setInputM] = useState(10);
  const [inputS, setInputS] = useState(0);

  const formatRemaining = (ms: number) => {
    const totalS = Math.ceil(ms / 1000);
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    const totalMs = (inputH * 3600 + inputM * 60 + inputS) * 1000;
    if (totalMs > 0) {
      store.startTimer(totalMs);
    }
  };

  const isSetting = !store.isRunning && store.duration === 0;

  const initialDuration = store.duration;
  let progress = 100;
  if (!isSetting && initialDuration > 0) {
    progress = (remaining / initialDuration) * 100;
  }

  return (
    <div className="clock-view timer-view">
      {isSetting ? (
        <div className="timer-setup">
          <div className="time-inputs-large">
            <input type="number" min="0" max="99" value={inputH} onChange={e => setInputH(Number(e.target.value))} /> <span>h</span>
            <input type="number" min="0" max="59" value={inputM} onChange={e => setInputM(Number(e.target.value))} /> <span>m</span>
            <input type="number" min="0" max="59" value={inputS} onChange={e => setInputS(Number(e.target.value))} /> <span>s</span>
          </div>
          <button className="clock-btn clock-btn-start clock-btn-large" onClick={startTimer}>Start</button>
        </div>
      ) : (
        <div className="timer-active">
          <div className="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="#333" strokeWidth="2" />
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-accent, #E95420)" strokeWidth="2" strokeDasharray="283" strokeDashoffset={283 - (progress / 100) * 283} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            </svg>
            <div className="timer-text">
              <h1>{formatRemaining(remaining)}</h1>
            </div>
          </div>
          
          <div className="stopwatch-controls">
            {store.isRunning ? (
              <button className="clock-btn clock-btn-pause" onClick={() => store.pauseTimer(store.duration - remaining)}>Pause</button>
            ) : (
              <button className="clock-btn clock-btn-start" onClick={store.resumeTimer}>Resume</button>
            )}
            <button className="clock-btn clock-btn-reset" onClick={store.resetTimer}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
