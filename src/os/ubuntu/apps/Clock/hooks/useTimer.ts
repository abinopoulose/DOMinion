import { useState, useEffect } from 'react';
import { useTimerStore } from '../store/useTimerStore';

export function useTimer() {
  const store = useTimerStore();
  const [remaining, setRemaining] = useState(store.duration);

  useEffect(() => {
    let animationFrameId: number;

    if (store.isRunning && store.startTime) {
      const update = () => {
        const now = Date.now();
        const elapsed = now - store.startTime!;
        const r = store.duration - elapsed;
        if (r <= 0) {
          setRemaining(0);
          store.pauseTimer(store.duration);
        } else {
          setRemaining(r);
          animationFrameId = requestAnimationFrame(update);
        }
      };
      animationFrameId = requestAnimationFrame(update);
    } else {
      setRemaining(store.duration);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [store.isRunning, store.startTime, store.duration]);

  return remaining;
}
