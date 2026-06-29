export type AppId = 'terminal' | 'file-manager' | 'browser';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  preMaximizeRect?: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
  };
  appState?: unknown;
}
