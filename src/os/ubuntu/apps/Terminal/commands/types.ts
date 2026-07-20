
/**
 * Terminal application state shape.
 * Defined here to avoid circular imports with Terminal.tsx.
 */
export interface TerminalAppState {
  cwdId: string;
  history: Array<{ id: string; prompt: string; command: string; output: string[]; isError?: boolean }>;
  commandHistory: string[];
  interactiveApp?: 'nano';
  nanoFileId?: string;
  nanoBuffer?: string;
  nanoModified?: boolean;
  nanoCursorLine?: number;
  // === SUDO STATE (refactored) ===
  sudoPasswordPrompt?: boolean;
  sudoPendingCommand?: string;
  sudoAttempts?: number;
  sudoAuthorized?: boolean;
  sudoTargetUser?: string;
  sudoCancellable?: boolean;

  // === SU STATE (new) ===
  suPasswordPrompt?: boolean;
  effectiveUser?: string;
  userStack?: string[];

  // === PASSWD STATE ===
  passwdState?: {
    step: 'current' | 'new' | 'confirm';
    targetUser: string;
    newPasswordAttempt?: string;
  };

  fontSize?: number;
}

import type { ShellEnvironment } from '../engine/ShellEnvironment';
import type { StandardStreams } from '../engine/Streams';

export type CommandHandler = (
  args: string[],
  env: ShellEnvironment,
  streams: StandardStreams
) => Promise<number> | number;
