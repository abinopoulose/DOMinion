import type { TerminalAppState } from './types';
import type { CommandResult } from '../commandParser/types';
import { commandRegistry } from './index';
import { parseArgs } from '../commandParser';
import {
  checkSudoAuthorization,
  isSudoCached,
  withElevation,
} from '../../../services/sudoService';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';

/**
 * sudo — Execute a command as another user.
 *
 * Usage:
 *   sudo [options] command [args...]
 *
 * Options:
 *   -u <user>   Run the command as the specified user (default: root)
 *   -S          Read password from standard input (not implemented in terminal,
 *               but recognized for educational display)
 *   -k          Invalidate the user's cached credentials
 *   -K          Remove the user's cached credentials entirely
 *   -l          List the allowed (and forbidden) commands for the invoking user
 *   -i          Run a login shell as the target user
 *
 * This handler is called by Terminal.tsx for commands that start with 'sudo'.
 * If the user's credentials are NOT cached, the handler returns a special
 * result that tells Terminal.tsx to enter password-prompt mode.
 * Terminal.tsx then calls `verifySudoPassword()` from SudoService.
 */
export interface SudoCommandResult extends CommandResult {
  /** If true, Terminal.tsx should enter password prompt mode */
  needsPassword?: boolean;
  /** The command to execute after password is verified */
  pendingCommand?: string;
  /** The target user for the sudo session */
  targetUser?: string;
}

export function handleSudo(
  args: string[],
  cwdId: string,
  updateCwd: (id: string) => void,
  clearHistory: () => void,
  appState: TerminalAppState | undefined,
  windowId: string,
  currentUser: string,
  process: any
): SudoCommandResult {
  // Parse sudo-specific flags
  const { flags, options, positional } = parseArgs(args, ['u']);
  const targetUser = options.u || 'root';

  // Handle -k: invalidate cached credentials
  if (flags.k) {
    useUbuntuAuthStore.getState().revokeSudoAccess(windowId);
    if (positional.length === 0) {
      return { output: [] }; // sudo -k with no command just invalidates
    }
  }

  // Handle -K: remove cached credentials entirely (same as -k in our simulation)
  if (flags.K) {
    useUbuntuAuthStore.getState().revokeSudoAccess(windowId);
    return { output: [] };
  }

  // Handle -l: list allowed commands
  if (flags.l) {
    return handleSudoList(currentUser);
  }

  // No command specified
  if (positional.length === 0 && !flags.i) {
    if (process) {
      ['usage: sudo [-u user] [-k] [-l] command [args...]'].forEach(l => process.stderr.writeLine(l));
      return { output: [], isError: true };
    }
    return { output: ['usage: sudo [-u user] [-k] [-l] command [args...]'], isError: true };
  }

  // Handle -i: login shell as target user
  if (flags.i) {
    return handleSudoShell(currentUser, targetUser, windowId);
  }

  // Check authorization via SudoService
  const commandName = positional[0];
  const authResult = checkSudoAuthorization({
    requestingUser: currentUser,
    targetUser,
    command: commandName,
  });

  if (!authResult.authorized) {
    const errStr = authResult.error || `${currentUser} is not in the sudoers file. This incident will be reported.`;
    if (process) {
      [errStr].forEach(l => process.stderr.writeLine(l));
      return { output: [], isError: true };
    }
    return { output: [errStr], isError: true };
  }

  // Check if credentials are cached
  if (authResult.requiresPassword && !isSudoCached(windowId)) {
    // Return a special result telling Terminal.tsx to enter password mode
    return {
      output: [],
      needsPassword: true,
      pendingCommand: positional.join(' '),
      targetUser,
    };
  }

  // Credentials cached or no password required — execute immediately
  return executeSudoCommand(positional, cwdId, updateCwd, clearHistory, appState, targetUser, process);
}

/**
 * Execute the actual command with elevated privileges.
 * Called after password verification (or when credentials are cached).
 */
export function executeSudoCommand(
  commandParts: string[],
  cwdId: string,
  updateCwd: (id: string) => void,
  clearHistory: () => void,
  appState: TerminalAppState | undefined,
  _targetUser: string = 'root',
  process: any
): Partial<CommandResult> {
  const commandName = commandParts[0];
  const commandArgs = commandParts.slice(1);

  const builtIns = ['cd', 'pwd', 'history', 'help', 'exit'];
  if (builtIns.includes(commandName)) {
    const lines = [
      `sudo: ${commandName}: command not found`,
      `sudo: "${commandName}" is a shell built-in command, it cannot be run directly.`,
      `sudo: the -s option may be used to run a privileged shell.`,
      `sudo: the -D option may be used to run a command in a specific directory.`,
    ];
    if (process) {
      lines.forEach(l => process.stderr.writeLine(l));
      return { output: [], isError: true };
    }
    return { output: lines, isError: true };
  }

  const handler = commandRegistry[commandName];
  if (!handler) {
    if (process) {
      [`sudo: ${commandName}: command not found`].forEach(l => process.stderr.writeLine(l));
      return { output: [], isError: true };
    }
    return { output: [`sudo: ${commandName}: command not found`], isError: true };
  }

  // Execute with elevated privileges
  return withElevation(() => handler(commandArgs, cwdId, updateCwd, clearHistory, appState as any, process));
}

/**
 * Handle `sudo -l` — list allowed commands for the current user.
 */
function handleSudoList(username: string): SudoCommandResult {
  const authResult = checkSudoAuthorization({
    requestingUser: username,
  });

  if (!authResult.authorized) {
    return { output: [`Sorry, user ${username} may not run sudo on ubuntu-web.`], isError: true };
  }

  return {
    output: [
      `Matching Defaults entries for ${username} on ubuntu-web:`,
      '    env_reset, mail_badpass,',
      '    secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin',
      '',
      `User ${username} may run the following commands on ubuntu-web:`,
      '    (ALL : ALL) ALL',
    ],
  };
}

/**
 * Handle `sudo -i` — open a login shell as root (or target user).
 * In our simulation, this changes the effective user for the terminal session.
 */
function handleSudoShell(
  currentUser: string,
  targetUser: string,
  windowId: string,
): SudoCommandResult {
  const authResult = checkSudoAuthorization({
    requestingUser: currentUser,
    targetUser,
  });

  if (!authResult.authorized) {
    return { output: [authResult.error || `${currentUser} is not in the sudoers file.`], isError: true };
  }

  if (authResult.requiresPassword && !isSudoCached(windowId)) {
    return {
      output: [],
      needsPassword: true,
      pendingCommand: '__sudo_shell__',
      targetUser,
    };
  }

  // Terminal.tsx handles the actual user switch by setting effectiveUser in appState
  return {
    output: [],
    pendingCommand: '__sudo_shell_authorized__', // Used to signal success
  };
}
