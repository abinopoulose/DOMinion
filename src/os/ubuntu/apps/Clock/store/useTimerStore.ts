import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

interface TimerStore {
  duration: number; // in ms
  startTime: number | null;
  isRunning: boolean;
  startTimer: (duration: number) => void;
  pauseTimer: (elapsed: number) => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      duration: 0,
      startTime: null,
      isRunning: false,
      startTimer: (duration) => set({ duration, startTime: Date.now(), isRunning: true }),
      pauseTimer: (elapsed) => {
        const remaining = get().duration - elapsed;
        set({ duration: remaining > 0 ? remaining : 0, startTime: null, isRunning: false });
      },
      resumeTimer: () => set({ startTime: Date.now(), isRunning: true }),
      resetTimer: () => set({ duration: 0, startTime: null, isRunning: false }),
    }),
    {
      name: 'ubuntu-clock-timer',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
