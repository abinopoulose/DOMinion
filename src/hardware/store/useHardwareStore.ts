import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PowerState = 'off' | 'os' | 'shutting_down';
export type OperatingSystem = 'ubuntu' | string | null;

interface HardwareStore {
  powerState: PowerState;
  activeOS: OperatingSystem;
  isSuspended: boolean;
  
  // Actions
  turnOn: () => void;
  bootOS: (os: OperatingSystem) => void;
  powerOff: () => void;
  hardPowerOff: () => void;
  suspend: () => void;
  wake: () => void;
}

export const useHardwareStore = create<HardwareStore>()(
  persist(
    (set) => ({
      powerState: 'off',
      activeOS: null,
      isSuspended: false,

      turnOn: () => set({ powerState: 'os', activeOS: 'ubuntu', isSuspended: false }),
      bootOS: (os) => set({ powerState: 'os', activeOS: os, isSuspended: false }),
      powerOff: () => set({ powerState: 'shutting_down', isSuspended: false }),
      hardPowerOff: () => set({ powerState: 'off', activeOS: null, isSuspended: false }),
      suspend: () => set({ isSuspended: true }),
      wake: () => set({ isSuspended: false }),
    }),
    {
      name: 'hardware-state',
      storage: createJSONStorage(() => localStorage),
      version: 2,
    }
  )
);
