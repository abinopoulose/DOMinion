import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

export interface Lap {
  id: string;
  lapTime: number; // Duration of this lap in ms
  totalTime: number; // Total elapsed time at this lap in ms
}

interface StopwatchStore {
  startTime: number | null;
  accumulatedTime: number; // Time accumulated before the current start
  isRunning: boolean;
  laps: Lap[];
  startStopwatch: () => void;
  pauseStopwatch: (currentElapsed: number) => void;
  resetStopwatch: () => void;
  addLap: (lapTime: number, totalTime: number) => void;
}

export const useStopwatchStore = create<StopwatchStore>()(
  persist(
    (set) => ({
      startTime: null,
      accumulatedTime: 0,
      isRunning: false,
      laps: [],
      startStopwatch: () => set({ startTime: Date.now(), isRunning: true }),
      pauseStopwatch: (currentElapsed) => set({ accumulatedTime: currentElapsed, startTime: null, isRunning: false }),
      resetStopwatch: () => set({ startTime: null, accumulatedTime: 0, isRunning: false, laps: [] }),
      addLap: (lapTime, totalTime) => set((state) => ({ laps: [{ id: crypto.randomUUID(), lapTime, totalTime }, ...state.laps] })),
    }),
    {
      name: 'ubuntu-clock-stopwatch',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
