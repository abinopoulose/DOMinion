import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { WindowState, AppId } from '../types';
import { ubuntuIdbStorage } from './persistence';
import { useWorkspaceStore } from './useWorkspaceStore';
import { useProcessManager } from '../services/ProcessManager';

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;
  previewFocusWindowId: string | null;

  setPreviewFocusWindowId: (id: string | null) => void;
  openWindow: (appId: AppId, initialAppState?: unknown, options?: { position?: { x: number, y: number } }) => string | void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  tileWindow: (id: string, side: 'left' | 'right' | null) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  updateAppState: (id: string, appState: unknown) => void;
  updateWindowTitle: (id: string, title: string) => void;
  moveWindowToWorkspace: (id: string, workspaceId: number) => void;
  shiftWorkspaces: (oldIndex: number, newIndex: number) => void;
  unfocusAll: () => void;
  clearAllWindows: () => void;
}

const DEFAULT_SIZES: Record<AppId, { width: number; height: number }> = {
  terminal: { width: 700, height: 500 },
  'file-manager': { width: 800, height: 550 },
  browser: { width: 900, height: 600 },
  'text-editor': { width: 600, height: 500 },
  calculator: { width: 320, height: 480 },
  settings: { width: 900, height: 600 },
  clock: { width: 800, height: 600 },
  'image-viewer': { width: 800, height: 600 },
  'video-player': { width: 800, height: 600 },
  'document-viewer': { width: 800, height: 900 },
  'disk-usage-analyzer': { width: 500, height: 400 },
  welcome: { width: 740, height: 520 },
  'error-reporter': { width: 500, height: 350 },
  'system-monitor': { width: 800, height: 600 },
  'terminal-preferences': { width: 600, height: 400 },
};

const APP_TITLES: Record<AppId, string> = {
  terminal: 'Terminal',
  'file-manager': 'Files',
  browser: 'Browser',
  'text-editor': 'Text Editor',
  calculator: 'Calculator',
  settings: 'Settings',
  clock: 'Clocks',
  'image-viewer': 'Image Viewer',
  'video-player': 'Video Player',
  'document-viewer': 'Document Viewer',
  'disk-usage-analyzer': 'Disk Usage Analyzer',
  welcome: 'Welcome to Ubuntu',
  'error-reporter': 'System Error',
  'system-monitor': 'System Monitor',
  'terminal-preferences': 'Terminal Preferences',
};

export const useWindowStore = create<WindowStore>()(
  persist(
    (set, get) => ({
      windows: [],
      nextZIndex: 100,
      previewFocusWindowId: null,

      setPreviewFocusWindowId: (id) => set({ previewFocusWindowId: id }),

      openWindow: (appId: AppId, initialAppState?: unknown, options?: { position?: { x: number, y: number } }) => {
        const { windows, nextZIndex } = get();

        // Enforce singleton for specific apps
        if (appId === 'settings' || appId === 'welcome') {
          const existingApp = windows.find(w => w.appId === appId);
          if (existingApp) {
            console.log(`[WindowStore] ${appId} already open, focusing window ${existingApp.id}`);
            useWorkspaceStore.getState().setActiveWorkspace(existingApp.workspaceId);
            set((state) => ({
              windows: state.windows.map(w => 
                w.id === existingApp.id 
                  ? { ...w, isMinimized: false, isFocused: true, zIndex: state.nextZIndex }
                  : { ...w, isFocused: false }
              ),
              nextZIndex: state.nextZIndex + 1,
            }));
            return existingApp.id;
          }
        }

        const id = uuidv4();
        console.log(`[WindowStore] Opening new window: ${appId} (ID: ${id})`);
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        
        // cascade offset
        const cascadeOffset = (windows.length % 8) * 30;
        
        const newWindow: WindowState = {
          id,
          appId,
          title: APP_TITLES[appId],
          position: options?.position || { x: 120 + cascadeOffset, y: 60 + cascadeOffset },
          size: DEFAULT_SIZES[appId],
          zIndex: nextZIndex,
          isMinimized: false,
          isMaximized: false,
          isFocused: true,
          workspaceId: activeWorkspace,
          appState: initialAppState,
        };

        // Spawn a process for this window
        useProcessManager.getState().spawn(appId, 3, 'user', id);

        set((state) => ({
          windows: [...state.windows.map(w => ({ ...w, isFocused: false })), newWindow],
          nextZIndex: state.nextZIndex + 1,
        }));
        
        return id;
      },

      closeWindow: (id: string) => {
        console.log(`[WindowStore] Closing window: ${id}`);
        // Kill the associated process
        useProcessManager.getState().killByWindowId(id);
        
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
        }));
      },

      focusWindow: (id: string) => {
        console.log(`[WindowStore] Focusing window: ${id}`);
        set((state) => {
          const windowExists = state.windows.some(w => w.id === id);
          if (!windowExists) return state;
          
          return {
            windows: state.windows.map((w) =>
              w.id === id
                ? { ...w, isFocused: true, zIndex: state.nextZIndex }
                : { ...w, isFocused: false }
            ),
            nextZIndex: state.nextZIndex + 1,
          };
        });
      },

      minimizeWindow: (id: string) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
          ),
        }));
      },

      restoreWindow: (id: string) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: false, isFocused: true, zIndex: state.nextZIndex } : { ...w, isFocused: false }
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
      },

      toggleMaximize: (id: string) => {
        set((state) => ({
          windows: state.windows.map((w) => {
            if (w.id === id) {
              return {
                ...w,
                isMaximized: !w.isMaximized,
                tileState: null,
              };
            }
            return w;
          }),
        }));
      },

      tileWindow: (id: string, side: 'left' | 'right' | null) => {
        set((state) => ({
          windows: state.windows.map((w) => {
            if (w.id === id) {
              return {
                ...w,
                isMaximized: false,
                tileState: side,
              };
            }
            return w;
          }),
        }));
      },

      updatePosition: (id: string, position: { x: number; y: number }) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, position } : w
          ),
        }));
      },

      updateSize: (id: string, size: { width: number; height: number }) => {
        set((state) => ({
          windows: state.windows.map((w) => (w.id === id ? { ...w, size } : w)),
        }));
      },

      updateAppState: (id: string, appState: unknown) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, appState } : w
          ),
        }));
      },

      updateWindowTitle: (id: string, title: string) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, title } : w
          ),
        }));
      },

      moveWindowToWorkspace: (id: string, workspaceId: number) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, workspaceId } : w
          ),
        }));
      },

      shiftWorkspaces: (oldIndex: number, newIndex: number) => {
        if (oldIndex === newIndex) return;
        set((state) => {
          return {
            windows: state.windows.map(w => {
              let wsId = w.workspaceId;
              if (wsId === oldIndex) {
                wsId = newIndex;
              } else if (oldIndex < newIndex && wsId > oldIndex && wsId <= newIndex) {
                wsId--;
              } else if (oldIndex > newIndex && wsId >= newIndex && wsId < oldIndex) {
                wsId++;
              }
              return { ...w, workspaceId: wsId };
            })
          };
        });
      },

      unfocusAll: () => {
        set((state) => ({
          windows: state.windows.map((w) => ({ ...w, isFocused: false })),
        }));
      },

      clearAllWindows: () => {
        set({ windows: [] });
      },
    }),
    {
      name: 'ubuntu-window-state',
      storage: createJSONStorage(() => ubuntuIdbStorage),
      partialize: (state) => ({ 
        windows: state.windows.map(({ appState, ...rest }) => rest), 
        nextZIndex: state.nextZIndex 
      }), // Omit appState to reduce serialization overhead
      merge: (persistedState: any, currentState) => {
        if (!persistedState || !persistedState.windows) {
          return { ...currentState, ...persistedState };
        }
        
        const maxWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const maxHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        
        const clampedWindows = persistedState.windows.map((w: WindowState) => {
          let { x, y } = w.position;
          // Ensure title bar is always accessible
          if (y < 28) y = 28; // top bar height
          if (y > maxHeight - 36) y = maxHeight - 36;
          if (x > maxWidth - 100) x = maxWidth - 100;
          if (x + w.size.width < 100) x = 100 - w.size.width;
          
          // Ensure workspaceId is present (migration for old persisted state)
          const workspaceId = typeof w.workspaceId === 'number' ? w.workspaceId : 0;
          
          return { ...w, position: { x, y }, workspaceId };
        });

        return { ...currentState, ...persistedState, windows: clampedWindows };
      },
    }
  )
);
