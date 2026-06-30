import { create } from 'zustand';

interface WindowsAuthStore {
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useWindowsAuthStore = create<WindowsAuthStore>((set) => ({
  currentUser: null,
  login: (username) => set({ currentUser: username }),
  logout: () => set({ currentUser: null }),
}));
