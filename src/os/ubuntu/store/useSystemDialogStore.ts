import { create } from 'zustand';

export type SystemDialogType = 'power_off' | 'restart' | 'log_out' | 'suspend' | 'auth' | 'polkit' | null;

/**
 * Polkit authentication request.
 * Represents a privileged action that needs user authentication.
 */
export interface PolkitAuthRequest {
  /** Human-readable description of the action */
  message: string;
  /** The polkit action ID (e.g., 'org.freedesktop.filemanager.write-root') */
  actionId: string;
  /** Optional details to show in the expandable section */
  details?: string;
  /** Icon to show (default: shield) */
  icon?: 'shield' | 'folder' | 'settings' | 'terminal';
  /** Callback on successful authentication */
  onSuccess: () => void;
  /** Optional callback on cancellation */
  onCancel?: () => void;
}

interface SystemDialogStore {
  activeDialog: SystemDialogType;

  // Legacy auth fields (deprecated — use polkitRequest instead)
  authMessage?: string;
  onAuthSuccess?: () => void;

  // New Polkit request
  polkitRequest: PolkitAuthRequest | null;

  // Actions
  openDialog: (type: SystemDialogType) => void;
  openPolkitDialog: (request: PolkitAuthRequest) => void;
  closeDialog: () => void;

  // Legacy (kept for backward compat, delegates to Polkit)
  openAuthDialog: (message: string, onSuccess: () => void) => void;
}

export const useSystemDialogStore = create<SystemDialogStore>((set) => ({
  activeDialog: null,
  polkitRequest: null,

  openDialog: (type) => set({
    activeDialog: type,
    polkitRequest: null,
    authMessage: undefined,
    onAuthSuccess: undefined,
  }),

  openPolkitDialog: (request) => set({
    activeDialog: 'polkit',
    polkitRequest: request,
  }),

  closeDialog: () => set({
    activeDialog: null,
    polkitRequest: null,
    authMessage: undefined,
    onAuthSuccess: undefined,
  }),

  // Legacy adapter — wraps old API into new Polkit request
  openAuthDialog: (message, onSuccess) => set({
    activeDialog: 'polkit',
    polkitRequest: {
      message,
      actionId: 'org.freedesktop.policykit.exec',
      onSuccess,
    },
    authMessage: message,
    onAuthSuccess: onSuccess,
  }),
}));
