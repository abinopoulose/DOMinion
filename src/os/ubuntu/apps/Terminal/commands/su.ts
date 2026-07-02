import type { CommandHandler } from './types';
import { useUbuntuVFSStore } from '../../../store';

/**
 * su — Switch user.
 *
 * Usage:
 *   su [username]      Switch to username (default: root)
 *   su - [username]    Switch and load the user's environment
 *   exit               Return to the previous user (handled in Terminal.tsx)
 *
 * Unlike sudo, `su` requires the TARGET user's password (not the current user's).
 *
 * This command sets a flag in the terminal app state that tells Terminal.tsx
 * to enter password-prompt mode for the target user, and upon success,
 * pushes the current user onto the userStack and sets effectiveUser.
 */
export const su: CommandHandler = (args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  let targetUser = 'root';

  for (const arg of args) {
    if (arg === '-' || arg === '-l' || arg === '--login') {
      // loginShell = true; // Unused
    } else if (!arg.startsWith('-')) {
      targetUser = arg;
    }
  }

  // Check if target user exists in /etc/passwd
  const store = useUbuntuVFSStore.getState();
  const passwdNode = store.resolvePath('/etc/passwd');
  let userExists = targetUser === 'root';
  
  if (passwdNode && passwdNode.type === 'file') {
    const lines = passwdNode.content.split('\n');
    if (lines.some(l => l.startsWith(targetUser + ':'))) {
      userExists = true;
    }
  }

  const currentUser = _appState.effectiveUser;

  if (!userExists) {
    [`su: user ${targetUser} does not exist`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  } else if (targetUser === currentUser) {
    [`su: user ${targetUser} is already logged in`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // The actual password prompt and user switching is handled by Terminal.tsx
  // We return a special marker that Terminal.tsx recognizes
  return {
    output: [],
    // Terminal.tsx will check if the command was 'su' and enter password mode
    // for the TARGET user (not the current user)
  };
};
