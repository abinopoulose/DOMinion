import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { WindowState, AppId } from '../types';
import { idbStorage } from '../core/persistence';

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;

  openWindow: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  updateAppState: (id: string, appState: unknown) => void;
  unfocusAll: () => void;
}

const DEFAULT_SIZES: Record<AppId, { width: number; height: number }> = {
  terminal: { width: 700, height: 500 },
  'file-manager': { width: 800, height: 550 },
  browser: { width: 900, height: 600 },
};

const APP_TITLES: Record<AppId, string> = {
  terminal: 'Terminal',
  'file-manager': 'Files',
  browser: 'Browser',
};

export const useWindowStore = create<WindowStore>()(
  persist(
    (set, get) => ({
      windows: [],
      nextZIndex: 100,

      openWindow: (appId: AppId) => {
        const id = uuidv4();
        const { windows, nextZIndex } = get();
        
        // cascade offset
        const cascadeOffset = (windows.length % 8) * 30;
        
        const newWindow: WindowState = {
          id,
          appId,
          title: APP_TITLES[appId],
          position: { x: 120 + cascadeOffset, y: 60 + cascadeOffset },
          size: DEFAULT_SIZES[appId],
          zIndex: nextZIndex,
          isMinimized: false,
          isMaximized: false,
          isFocused: true,
        };

        set((state) => ({
          windows: [...state.windows.map(w => ({ ...w, isFocused: false })), newWindow],
          nextZIndex: state.nextZIndex + 1,
        }));
      },

      closeWindow: (id: string) => {
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
        }));
      },

      focusWindow: (id: string) => {
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
              if (w.isMaximized) {
                return {
                  ...w,
                  isMaximized: false,
                  position: w.preMaximizeRect?.pos || w.position,
                  size: w.preMaximizeRect?.size || w.size,
                };
              } else {
                const topbarHeight = 28;
                const dockSpace = 90;
                return {
                  ...w,
                  isMaximized: true,
                  preMaximizeRect: { pos: w.position, size: w.size },
                  position: { x: 0, y: topbarHeight },
                  size: {
                    width: window.innerWidth,
                    height: window.innerHeight - topbarHeight - dockSpace,
                  },
                };
              }
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

      unfocusAll: () => {
        set((state) => ({
          windows: state.windows.map((w) => ({ ...w, isFocused: false })),
        }));
      },
    }),
    {
      name: 'ubuntu-window-state',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ windows: state.windows, nextZIndex: state.nextZIndex }), // store whole window state
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
          
          return { ...w, position: { x, y } };
        });

        return { ...currentState, ...persistedState, windows: clampedWindows };
      },
    }
  )
);
