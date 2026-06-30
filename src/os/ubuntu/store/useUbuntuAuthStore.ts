import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UbuntuAuthStore {
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useUbuntuAuthStore = create<UbuntuAuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      login: (username) => set({ currentUser: username }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'ubuntu-auth-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
