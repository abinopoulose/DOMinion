import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  active: boolean;
  repeatDays: number[]; // 0 = Sunday
}

interface AlarmStore {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  toggleAlarm: (id: string, active: boolean) => void;
  deleteAlarm: (id: string) => void;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set) => ({
      alarms: [],
      addAlarm: (alarm) => set((state) => ({
        alarms: [...state.alarms, { ...alarm, id: crypto.randomUUID() }]
      })),
      toggleAlarm: (id, active) => set((state) => ({
        alarms: state.alarms.map(a => a.id === id ? { ...a, active } : a)
      })),
      deleteAlarm: (id) => set((state) => ({
        alarms: state.alarms.filter(a => a.id !== id)
      })),
    }),
    {
      name: 'ubuntu-clock-alarms',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
