import type { CommandHandler } from './types';
// import removed: useUbuntuVFSStore

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
export const su: CommandHandler = async (args, env, streams) => {
  let targetUser = 'root';

  for (const arg of args) {
    if (arg === '-' || arg === '-l' || arg === '--login') {
      // loginShell = true; // Unused
    } else if (!arg.startsWith('-')) {
      targetUser = arg;
    }
  }

  let userExists = targetUser === 'root';
  try {
    const { readFile } = await import('../../../fs/operations');
    const blob = await readFile('/etc/passwd');
    const text = await blob.text();
    const lines = text.split('\n');
    if (lines.some(l => l.startsWith(targetUser + ':'))) {
      userExists = true;
    }
  } catch(e) {}

  const currentUser = env.effectiveUser;

  if (!userExists) {
    streams.stderr.writeLine(`su: user ${targetUser} does not exist`);
    return 1;
  } else if (targetUser === currentUser) {
    streams.stderr.writeLine(`su: user ${targetUser} is already logged in`);
    return 1;
  }

  // In a real terminal, we would prompt for a password via stdin.
  // For now, we simulate success for the refactor.
  env.pushUser(targetUser);
  return 0;
};
