import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage, userScopedStorage } from './persistence';

interface DesktopStore {
  wallpaper: string;
  theme: 'dark' | 'light';
  setWallpaper: (path: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const defaultDesktopState = {
  wallpaper: '',
  theme: 'dark' as 'dark' | 'light',
};

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set) => ({
      ...defaultDesktopState,
      setWallpaper: (path: string) => set({ wallpaper: path }),
      setTheme: (theme: 'dark' | 'light') => set({ theme }),
    }),
    {
      name: 'ubuntu-desktop-state',
      storage: createJSONStorage(() => userScopedStorage(ubuntuIdbStorage)),
    }
  )
);
