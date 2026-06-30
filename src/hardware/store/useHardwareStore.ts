import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PowerState = 'off' | 'post' | 'bios' | 'grub' | 'os' | 'shutting_down';
export type OperatingSystem = 'ubuntu' | 'windows' | null;

interface HardwareStore {
  powerState: PowerState;
  activeOS: OperatingSystem;
  
  // Actions
  turnOn: () => void;
  enterBIOS: () => void;
  enterGRUB: () => void;
  bootOS: (os: OperatingSystem) => void;
  powerOff: () => void;
  hardPowerOff: () => void;
}

export const useHardwareStore = create<HardwareStore>()(
  persist(
    (set) => ({
      powerState: 'off',
      activeOS: null,

      turnOn: () => set({ powerState: 'post', activeOS: null }),
      enterBIOS: () => set({ powerState: 'bios' }),
      enterGRUB: () => set({ powerState: 'grub' }),
      bootOS: (os) => set({ powerState: 'os', activeOS: os }),
      powerOff: () => set({ powerState: 'shutting_down' }),
      hardPowerOff: () => set({ powerState: 'off', activeOS: null }),
    }),
    {
      name: 'hardware-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
