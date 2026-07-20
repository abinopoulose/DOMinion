import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TerminalProfile {
  name: string;
  fontFamily: string;
  fontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  colorScheme: string; // key in themes.ts
  opacity: number;
  scrollbackLines: number;
  bellStyle: 'none' | 'visual' | 'sound';
}

interface TerminalProfileStore {
  activeProfile: TerminalProfile;
  updateProfile: (updates: Partial<TerminalProfile>) => void;
  resetProfile: () => void;
}

const defaultProfile: TerminalProfile = {
  name: 'Default',
  fontFamily: '"Ubuntu Mono", monospace',
  fontSize: 14,
  cursorStyle: 'block',
  cursorBlink: false,
  colorScheme: 'ubuntu',
  opacity: 1.0,
  scrollbackLines: 1000,
  bellStyle: 'none',
};

export const useTerminalProfileStore = create<TerminalProfileStore>()(
  persist(
    (set) => ({
      activeProfile: { ...defaultProfile },
      updateProfile: (updates) =>
        set((state) => ({
          activeProfile: { ...state.activeProfile, ...updates },
        })),
      resetProfile: () => set({ activeProfile: { ...defaultProfile } }),
    }),
    {
      name: 'ubuntu-terminal-profile',
    }
  )
);
