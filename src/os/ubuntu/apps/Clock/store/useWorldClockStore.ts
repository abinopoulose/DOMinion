import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

export interface WorldClock {
  id: string;
  timezone: string;
  city: string;
}

interface WorldClockStore {
  clocks: WorldClock[];
  addClock: (clock: Omit<WorldClock, 'id'>) => void;
  removeClock: (id: string) => void;
}

export const useWorldClockStore = create<WorldClockStore>()(
  persist(
    (set) => ({
      clocks: [],
      addClock: (clock) => set((state) => ({ clocks: [...state.clocks, { ...clock, id: crypto.randomUUID() }] })),
      removeClock: (id) => set((state) => ({ clocks: state.clocks.filter(c => c.id !== id) })),
    }),
    {
      name: 'ubuntu-clock-world',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
