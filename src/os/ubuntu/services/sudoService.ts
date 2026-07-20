import { useUbuntuAuthStore } from '../store/useUbuntuAuthStore';
import { verifyPassword } from '../utils/passwordHasher';
import { parseSudoersFile, getUserGroups } from './sudoersParser';
// import { useUbuntuVFSStore } from '../store';
import { setTempExecutionUser } from '../store/useUbuntuVFSStore';
import { UBUNTU_ACCOUNTS } from '../../../config/accounts';

/**
 * Result of a sudo authorization check.
 */
export interface SudoAuthResult {
  authorized: boolean;
  requiresPassword: boolean;
  error?: string;
  errorCode?: 'NOT_IN_SUDOERS' | 'ACCOUNT_LOCKED' | 'THROTTLED' | 'INVALID_PASSWORD' | 'NO_COMMAND';
}

/**
 * Result of a sudo password verification.
 */
export interface SudoVerifyResult {
  success: boolean;
  error?: string;
  errorCode?: 'INVALID_PASSWORD' | 'ACCOUNT_LOCKED' | 'THROTTLED' | 'MAX_ATTEMPTS';
  attemptsRemaining?: number;
}

/**
 * Options for sudo authorization.
 */
export interface SudoOptions {
  /** The user requesting sudo elevation */
  requestingUser: string;
  /** The target user to run the command as (default: 'root') */
  targetUser?: string;
  /** The command being executed (for per-command sudoers rules) */
  command?: string;
  /** The terminal window ID (for credential caching) */
  windowId?: string;
}

/**
 * The maximum number of password attempts before sudo gives up.
 * Matches real Ubuntu behavior: 3 attempts per sudo invocation.
 */
const MAX_SUDO_ATTEMPTS = 3;

/**
 * Check if a user is authorized to use sudo.
 * This reads /etc/sudoers (via VFS) to determine authorization.
 *
 * Does NOT verify the password — only checks if the user CAN sudo.
 *
 * @returns SudoAuthResult with authorization status and whether password is needed.
 */
export async function checkSudoAuthorization(options: SudoOptions): Promise<SudoAuthResult> {
  const { requestingUser, targetUser = 'root', command } = options;

  // Root can always sudo
  if (requestingUser === 'root') {
    return { authorized: true, requiresPassword: false };
  }

  // Parse sudoers
  const config = await parseSudoersFile();

  if (!config) {
    // Fallback: if /etc/sudoers doesn't exist, check config/accounts.ts
    const accountRole = UBUNTU_ACCOUNTS.find((a: any) => a.username === requestingUser)?.role;
    if (accountRole === 'admin') {
      return { authorized: true, requiresPassword: true };
    }
    return {
      authorized: false,
      requiresPassword: false,
      error: `${requestingUser} is not in the sudoers file. This incident will be reported.`,
      errorCode: 'NOT_IN_SUDOERS',
    };
  }

  // Get user's groups
  const userGroups = await getUserGroups(requestingUser);

  // Check rules (last matching rule wins, like real sudoers)
  let matchedRule: typeof config.rules[0] | null = null;

  for (const rule of config.rules) {
    if (rule.isGroup) {
      // Group rule: check if user is in the specified group
      if (userGroups.includes(rule.principal)) {
        matchedRule = rule;
      }
    } else {
      // User rule: direct username match
      if (rule.principal === requestingUser) {
        matchedRule = rule;
      }
    }
  }

  if (!matchedRule) {
    return {
      authorized: false,
      requiresPassword: false,
      error: `${requestingUser} is not in the sudoers file. This incident will be reported.`,
      errorCode: 'NOT_IN_SUDOERS',
    };
  }

  // Check if the target user is allowed
  if (!matchedRule.runAsUsers.includes('ALL') && !matchedRule.runAsUsers.includes(targetUser)) {
    return {
      authorized: false,
      requiresPassword: false,
      error: `Sorry, user ${requestingUser} is not allowed to execute commands as ${targetUser}.`,
      errorCode: 'NOT_IN_SUDOERS',
    };
  }

  // Check if the specific command is allowed
  if (command && !matchedRule.commands.includes('ALL')) {
    const isCommandAllowed = matchedRule.commands.some(c => command.startsWith(c));
    if (!isCommandAllowed) {
      return {
        authorized: false,
        requiresPassword: false,
        error: `Sorry, user ${requestingUser} is not allowed to execute '${command}' as ${targetUser}.`,
        errorCode: 'NOT_IN_SUDOERS',
      };
    }
  }

  return {
    authorized: true,
    requiresPassword: matchedRule.requiresPassword,
  };
}

/**
 * Check if sudo credentials are cached for a specific terminal window.
 * If cached, the user doesn't need to re-enter their password.
 */
export function isSudoCached(windowId: string): boolean {
  return useUbuntuAuthStore.getState().isSudoCached(windowId);
}

/**
 * Verify a user's password for sudo authentication.
 * This reads /etc/shadow to verify the password hash.
 *
 * Also handles:
 * - Attempt throttling (via auth store)
 * - Credential caching on success
 * - Attempt tracking on failure
 *
 * @returns SudoVerifyResult with success status.
 */
export async function verifySudoPassword(
  username: string,
  password: string,
  windowId: string,
  currentAttempt: number = 1
): Promise<SudoVerifyResult> {
  const authStore = useUbuntuAuthStore.getState();

  // Check if throttled
  if (authStore.isThrottled(username)) {
    const remainingMs = authStore.getThrottleRemainingMs(username);
    const remainingSec = Math.ceil(remainingMs / 1000);
    return {
      success: false,
      error: `Account temporarily locked. Try again in ${remainingSec} seconds.`,
      errorCode: 'THROTTLED',
    };
  }

  // Read /etc/shadow
  let isValid = false;
  let shadowNodeExists = false;
  
  try {
    const { getAbsolutePathAsync } = await import('../fs/pathResolver');
    const { readFile } = await import('../fs/operations');
    const path = await getAbsolutePathAsync('/etc/shadow');
    const contentBlob = await readFile(path);
    let content = '';
    if (contentBlob instanceof Blob) {
      content = await contentBlob.text();
    } else {
      content = contentBlob as string;
    }
    shadowNodeExists = true;
    
    const lines = content.split('\n');
    const userLine = lines.find(l => l.startsWith(username + ':'));
    if (userLine) {
      const hash = userLine.split(':')[1];
      isValid = await verifyPassword(password, hash);
    }
  } catch (e) {
    // fallback
  }

  // Fallback to config/accounts.ts
  if (!isValid && !shadowNodeExists) {
    const userObj = UBUNTU_ACCOUNTS.find((u: any) => u.username === username);
    isValid = !!(userObj && userObj.password === password);
  }

  if (isValid) {
    // Success — grant sudo access and reset attempts
    authStore.grantSudoAccess(windowId);
    authStore.resetAttempts(username);
    return { success: true };
  }

  // Failure
  authStore.recordFailedAttempt(username);

  if (currentAttempt >= MAX_SUDO_ATTEMPTS) {
    return {
      success: false,
      error: `sudo: ${MAX_SUDO_ATTEMPTS} incorrect password attempts`,
      errorCode: 'MAX_ATTEMPTS',
      attemptsRemaining: 0,
    };
  }

  return {
    success: false,
    error: 'Sorry, try again.',
    errorCode: 'INVALID_PASSWORD',
    attemptsRemaining: MAX_SUDO_ATTEMPTS - currentAttempt,
  };
}

/**
 * Convenience: Execute a callback with elevated (root) privileges.
 * This is the primary API for commands that need sudo elevation.
 *
 * @param callback - The function to execute with root privileges
 * @returns The return value of the callback
 *
 * Usage:
 *   const result = withElevation(() => {
 *     // All VFS operations in here run as root
 *     store.deleteNode(protectedNodeId);
 *   });
 */
export function withElevation<T>(operation: () => T | Promise<T>): T | Promise<T> {
  try {
    setTempExecutionUser('root');
    const result = operation();
    if (result instanceof Promise) {
      return result.finally(() => {
        setTempExecutionUser(null);
      });
    }
    setTempExecutionUser(null);
    return result;
  } catch (error) {
    setTempExecutionUser(null);
    throw error;
  }
}

/**
 * Get the configured sudo timestamp timeout from /etc/sudoers.
 * Falls back to 15 minutes (Ubuntu default) if not configured.
 *
 * @returns Timeout in milliseconds
 */
export async function getSudoTimestampTimeout(): Promise<number> {
  const config = await parseSudoersFile();
  if (config) {
    return config.defaults.timestampTimeout * 60 * 1000;
  }
  return 15 * 60 * 1000; // 15 minutes default
}
