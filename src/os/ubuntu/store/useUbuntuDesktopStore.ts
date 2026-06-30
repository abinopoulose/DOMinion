import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from './persistence';

interface DesktopStore {
  wallpaper: string;
  theme: 'dark' | 'light';
  setWallpaper: (path: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set) => ({
      wallpaper: '', // Set default if needed
      theme: 'dark',
      setWallpaper: (path: string) => set({ wallpaper: path }),
      setTheme: (theme: 'dark' | 'light') => set({ theme }),
    }),
    {
      name: 'ubuntu-desktop-state',
      storage: createJSONStorage(() => ubuntuIdbStorage),
    }
  )
);
