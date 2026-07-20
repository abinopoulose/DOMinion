import { create } from 'zustand';
import { getAuthContext, setTempExecutionUser } from './authContext';
export { getAuthContext, setTempExecutionUser };

export interface ClipboardState {
  action: 'cut' | 'copy' | null;
  nodeIds: string[];
}

interface VFSStore {
  clipboard: ClipboardState;
  setClipboard: (action: 'cut' | 'copy' | null, nodeIds: string[]) => void;
}

export const useVFSStore = create<VFSStore>((set) => ({
  clipboard: { action: null, nodeIds: [] },
  setClipboard: (action, nodeIds) => set({ clipboard: { action, nodeIds } }),
}));

export const useUbuntuVFSStore = useVFSStore;
