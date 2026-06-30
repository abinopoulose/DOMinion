export type AppId = 'terminal' | 'file-manager' | 'browser' | 'text-editor' | 'settings';

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
  /** Which virtual desktop / workspace this window belongs to (0-based) */
  workspaceId: number;
  preMaximizeRect?: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
  };
  appState?: unknown;
}
