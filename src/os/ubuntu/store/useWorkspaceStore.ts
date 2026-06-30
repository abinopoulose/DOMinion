import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from './persistence';

export interface Workspace {
  id: number;
  label: string;
}

interface WorkspaceStore {
  /** Currently active workspace index (0-based) */
  activeWorkspace: number;
  /** Total number of workspaces */
  workspaceCount: number;
  /** Whether the workspace overview (Activities) is open */
  isOverviewOpen: boolean;
  /** Whether the App Grid is open (part of Activities) */
  isAppGridOpen: boolean;

  setActiveWorkspace: (index: number) => void;
  nextWorkspace: () => void;
  prevWorkspace: () => void;
  addWorkspace: () => void;
  removeWorkspace: () => void;
  toggleOverview: () => void;
  openOverview: () => void;
  closeOverview: () => void;

  toggleAppGrid: () => void;
  openAppGrid: () => void;
  closeAppGrid: () => void;

  reorderWorkspaces: (oldIndex: number, newIndex: number) => void;

  getWorkspaces: () => Workspace[];
  resetWorkspaces: () => void;
}

const MAX_WORKSPACES = 8;
const MIN_WORKSPACES = 2;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      activeWorkspace: 0,
      workspaceCount: 4,
      isOverviewOpen: false,
      isAppGridOpen: false,

      setActiveWorkspace: (index: number) => {
        const { workspaceCount } = get();
        if (index >= 0 && index < workspaceCount) {
          set({ activeWorkspace: index, isOverviewOpen: false, isAppGridOpen: false });
        }
      },

      nextWorkspace: () => {
        const { activeWorkspace, workspaceCount } = get();
        if (activeWorkspace < workspaceCount - 1) {
          set({ activeWorkspace: activeWorkspace + 1 });
        }
      },

      prevWorkspace: () => {
        const { activeWorkspace } = get();
        if (activeWorkspace > 0) {
          set({ activeWorkspace: activeWorkspace - 1 });
        }
      },

      addWorkspace: () => {
        const { workspaceCount } = get();
        if (workspaceCount < MAX_WORKSPACES) {
          set({ workspaceCount: workspaceCount + 1 });
        }
      },

      removeWorkspace: () => {
        const { workspaceCount, activeWorkspace } = get();
        if (workspaceCount > MIN_WORKSPACES) {
          const newCount = workspaceCount - 1;
          set({
            workspaceCount: newCount,
            activeWorkspace: Math.min(activeWorkspace, newCount - 1),
          });
        }
      },

      toggleOverview: () => set((s) => ({ isOverviewOpen: !s.isOverviewOpen, isAppGridOpen: false })),
      openOverview: () => set({ isOverviewOpen: true, isAppGridOpen: false }),
      closeOverview: () => set({ isOverviewOpen: false, isAppGridOpen: false }),

      toggleAppGrid: () => set((s) => ({ isAppGridOpen: !s.isAppGridOpen, isOverviewOpen: true })),
      openAppGrid: () => set({ isAppGridOpen: true, isOverviewOpen: true }),
      closeAppGrid: () => set({ isAppGridOpen: false }),

      reorderWorkspaces: (oldIndex: number, newIndex: number) => {
        if (oldIndex === newIndex) return;
        
        import('./useUbuntuWindowStore').then(({ useWindowStore }) => {
          useWindowStore.getState().shiftWorkspaces(oldIndex, newIndex);
        });

        set((state) => {
          let activeWs = state.activeWorkspace;
          if (activeWs === oldIndex) {
            activeWs = newIndex;
          } else if (oldIndex < newIndex && activeWs > oldIndex && activeWs <= newIndex) {
            activeWs--;
          } else if (oldIndex > newIndex && activeWs >= newIndex && activeWs < oldIndex) {
            activeWs++;
          }
          return { activeWorkspace: activeWs };
        });
      },

      getWorkspaces: () => {
        const { workspaceCount } = get();
        return Array.from({ length: workspaceCount }, (_, i) => ({
          id: i,
          label: `Workspace ${i + 1}`,
        }));
      },

      resetWorkspaces: () => {
        set({ activeWorkspace: 0, workspaceCount: MIN_WORKSPACES, isOverviewOpen: false, isAppGridOpen: false });
      },
    }),
    {
      name: 'ubuntu-workspace-state',
      storage: createJSONStorage(() => ubuntuIdbStorage),
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace,
        workspaceCount: state.workspaceCount,
      }),
    }
  )
);
