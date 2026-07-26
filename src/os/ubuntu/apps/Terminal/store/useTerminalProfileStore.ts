import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedStorage } from '../../../store/persistence';

export interface TerminalProfile {
  name: string;
  fontFamily: string;
  fontSize: number;
  useSystemFont: boolean;
  lineHeight: number;
  letterSpacing: number;
  blinkingText: 'always' | 'never' | 'focused';
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: 'system' | 'always' | 'never';
  colorScheme: string; // key in themes.ts
  opacity: number;
  scrollbackLines: number;
  bellStyle: 'none' | 'visual' | 'sound';
  audibleBell: boolean;
  visualBell: boolean;
  allowScreenReaders: boolean;
  restoreSession: boolean;
  restoreWindowSize: boolean;
  newTabPosition: 'last' | 'next';
  useScrollbars: 'always' | 'never' | 'system';
}

interface TerminalProfileStore {
  activeProfile: TerminalProfile;
  updateProfile: (updates: Partial<TerminalProfile>) => void;
  resetProfile: () => void;
  
  profiles: TerminalProfile[];
  activeProfileIndex: number;
  addProfile: (name: string) => void;
  deleteProfile: (index: number) => void;
  renameProfile: (index: number, newName: string) => void;
  switchProfile: (index: number) => void;
  duplicateProfile: (index: number) => void;
}

const defaultProfile: TerminalProfile = {
  name: 'Default',
  fontFamily: '"Ubuntu Mono", monospace',
  fontSize: 14,
  useSystemFont: true,
  lineHeight: 1.0,
  letterSpacing: 1.0,
  blinkingText: 'always',
  cursorStyle: 'block',
  cursorBlink: 'system',
  colorScheme: 'ubuntu',
  opacity: 1.0,
  scrollbackLines: 1000,
  bellStyle: 'none',
  
  audibleBell: true,
  visualBell: true,
  allowScreenReaders: true,
  restoreSession: true,
  restoreWindowSize: false,
  newTabPosition: 'last',
  useScrollbars: 'system',
};

export const defaultTerminalProfileState = {
  activeProfile: { ...defaultProfile },
  profiles: [{ ...defaultProfile }],
  activeProfileIndex: 0,
};

export const useTerminalProfileStore = create<TerminalProfileStore>()(
  persist(
    (set) => ({
      ...defaultTerminalProfileState,

      updateProfile: (updates) =>
        set((state) => {
          const updatedProfile = { ...state.activeProfile, ...updates };
          const newProfiles = [...state.profiles];
          newProfiles[state.activeProfileIndex] = updatedProfile;
          return { activeProfile: updatedProfile, profiles: newProfiles };
        }),
        
      resetProfile: () => 
        set((state) => {
          const reset = { ...defaultProfile, name: state.activeProfile.name };
          const newProfiles = [...state.profiles];
          newProfiles[state.activeProfileIndex] = reset;
          return { activeProfile: reset, profiles: newProfiles };
        }),
        
      addProfile: (name) => 
        set((state) => {
          const newProfile = { ...defaultProfile, name };
          const newProfiles = [...state.profiles, newProfile];
          return { 
            profiles: newProfiles, 
            activeProfileIndex: newProfiles.length - 1,
            activeProfile: newProfile 
          };
        }),
        
      deleteProfile: (index) => 
        set((state) => {
          if (state.profiles.length <= 1) return state; // cannot delete last profile
          const newProfiles = [...state.profiles];
          newProfiles.splice(index, 1);
          const newIndex = state.activeProfileIndex === index 
            ? 0 
            : state.activeProfileIndex > index 
              ? state.activeProfileIndex - 1 
              : state.activeProfileIndex;
              
          return {
            profiles: newProfiles,
            activeProfileIndex: newIndex,
            activeProfile: newProfiles[newIndex]
          };
        }),
        
      renameProfile: (index, newName) => 
        set((state) => {
          const newProfiles = [...state.profiles];
          newProfiles[index] = { ...newProfiles[index], name: newName };
          const active = state.activeProfileIndex === index ? newProfiles[index] : state.activeProfile;
          return { profiles: newProfiles, activeProfile: active };
        }),
        
      switchProfile: (index) => 
        set((state) => {
          if (index < 0 || index >= state.profiles.length) return state;
          return {
            activeProfileIndex: index,
            activeProfile: state.profiles[index]
          };
        }),
        
      duplicateProfile: (index) => 
        set((state) => {
          if (index < 0 || index >= state.profiles.length) return state;
          const cloned = { ...state.profiles[index], name: `Copy of ${state.profiles[index].name}` };
          const newProfiles = [...state.profiles, cloned];
          return {
            profiles: newProfiles,
            activeProfileIndex: newProfiles.length - 1,
            activeProfile: cloned
          };
        })
    }),
    {
      name: 'ubuntu-terminal-profile',
      storage: createJSONStorage(() => userScopedStorage(localStorage)),
    }
  )
);
