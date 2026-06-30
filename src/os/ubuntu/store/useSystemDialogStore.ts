import { create } from 'zustand';

export type SystemDialogType = 'power_off' | 'restart' | 'log_out' | 'suspend' | null;

interface SystemDialogStore {
  activeDialog: SystemDialogType;
  openDialog: (type: SystemDialogType) => void;
  closeDialog: () => void;
}

export const useSystemDialogStore = create<SystemDialogStore>((set) => ({
  activeDialog: null,
  openDialog: (type) => set({ activeDialog: type }),
  closeDialog: () => set({ activeDialog: null }),
}));
