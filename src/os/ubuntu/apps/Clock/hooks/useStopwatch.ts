import { useState, useEffect } from 'react';
import { useStopwatchStore } from '../store/useStopwatchStore';

export function useStopwatch() {
  const store = useStopwatchStore();
  const [elapsed, setElapsed] = useState(store.accumulatedTime);

  useEffect(() => {
    let animationFrameId: number;
    
    if (store.isRunning && store.startTime) {
      const update = () => {
        setElapsed(store.accumulatedTime + (Date.now() - store.startTime!));
        animationFrameId = requestAnimationFrame(update);
      };
      animationFrameId = requestAnimationFrame(update);
    } else {
      setElapsed(store.accumulatedTime);
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [store.isRunning, store.startTime, store.accumulatedTime]);

  return elapsed;
}
