import { getAbsolutePathAsync } from '../fs/pathResolver';
import { readFile } from '../fs/operations';

/**
 * Represents a parsed sudoers rule.
 *
 * Real sudoers format:
 *   user  host=(runas_user:runas_group) command_list
 *   %group host=(runas_user:runas_group) command_list
 *
 * Simplified for simulation:
 *   - We ignore host (always ALL)
 *   - We support user and %group prefixes
 *   - We support ALL and specific commands
 *   - We support NOPASSWD directive
 */
export interface SudoersRule {
  /** The user or group this rule applies to. Groups are prefixed with '%' */
  principal: string;
  /** Whether this is a group rule */
  isGroup: boolean;
  /** Which users this principal can run commands as. 'ALL' = any user */
  runAsUsers: string[];
  /** Which groups this principal can run commands as. 'ALL' = any group */
  runAsGroups: string[];
  /** Which commands are allowed. 'ALL' = all commands */
  commands: string[];
  /** Whether password is required for this rule */
  requiresPassword: boolean;
}

/**
 * Parsed sudoers configuration.
 */
export interface SudoersConfig {
  rules: SudoersRule[];
  defaults: {
    timestampTimeout: number;  // in minutes (default: 15)
    mailBadpass: boolean;
    envReset: boolean;
  };
}

/**
 * Parse the /etc/sudoers file from VFS.
 * Returns null if the file doesn't exist or can't be parsed.
 *
 * This parser handles a subset of real sudoers syntax:
 * - User rules: `username ALL=(ALL:ALL) ALL`
 * - Group rules: `%groupname ALL=(ALL) ALL`
 * - NOPASSWD: `username ALL=(ALL) NOPASSWD: /usr/bin/command`
 * - Defaults: `Defaults timestamp_timeout=15`
 * - Comments: Lines starting with `#`
 * - Blank lines are ignored
 */
export async function parseSudoersFile(): Promise<SudoersConfig | null> {
  try {
    const path = await getAbsolutePathAsync('/etc/sudoers');
    const contentBlob = await readFile(path);
    let content = '';
    if (contentBlob instanceof Blob) {
      content = await contentBlob.text();
    } else {
      content = contentBlob as string;
    }

    if (!content) return null;

  const config: SudoersConfig = {
    rules: [],
    defaults: {
      timestampTimeout: 15,
      mailBadpass: true,
      envReset: true,
    },
  };

  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip comments and blank lines
    if (!line || line.startsWith('#')) continue;

    // Parse Defaults
    if (line.startsWith('Defaults')) {
      const defaultsBody = line.slice(8).trim();

      // Handle tab-separated or space-separated
      const parts = defaultsBody.split(/[=\s]+/);

      if (parts[0] === 'timestamp_timeout' && parts[1]) {
        const timeout = parseInt(parts[1], 10);
        if (!isNaN(timeout)) {
          config.defaults.timestampTimeout = timeout;
        }
      } else if (parts[0] === 'mail_badpass') {
        config.defaults.mailBadpass = true;
      } else if (parts[0] === 'env_reset') {
        config.defaults.envReset = true;
      }

      continue;
    }

    // Parse user/group rules
    // Format: principal<TAB or SPACE>host=(runas) commands
    // Example: abino  ALL=(ALL:ALL) ALL
    // Example: %sudo  ALL=(ALL:ALL) ALL
    // Example: user   ALL=(ALL) NOPASSWD: /usr/bin/apt

    const match = line.match(
      /^(%?\w+)\s+\w+\s*=\s*\(([^)]*)\)\s*(.+)$/
    );

    if (!match) continue;

    const [, principal, runasSpec, commandSpec] = match;
    const isGroup = principal.startsWith('%');
    const principalName = isGroup ? principal.slice(1) : principal;

    // Parse runas specification: (user:group) or (ALL:ALL) or (ALL)
    let runAsUsers: string[] = ['ALL'];
    let runAsGroups: string[] = ['ALL'];

    if (runasSpec.includes(':')) {
      const [usersPart, groupsPart] = runasSpec.split(':');
      runAsUsers = usersPart.split(',').map(s => s.trim());
      runAsGroups = groupsPart.split(',').map(s => s.trim());
    } else {
      runAsUsers = runasSpec.split(',').map(s => s.trim());
    }

    // Parse commands and NOPASSWD
    let requiresPassword = true;
    let commands: string[];

    if (commandSpec.startsWith('NOPASSWD:')) {
      requiresPassword = false;
      commands = commandSpec.slice(9).trim().split(',').map(s => s.trim());
    } else {
      commands = commandSpec.split(',').map(s => s.trim());
    }

    config.rules.push({
      principal: principalName,
      isGroup,
      runAsUsers,
      runAsGroups,
      commands,
      requiresPassword,
    });
  }

  return config;
  } catch {
    return null;
  }
}

/**
 * Parse /etc/group to get group memberships for a user.
 * Returns an array of group names the user belongs to.
 */
export async function getUserGroups(username: string): Promise<string[]> {
  try {
    const path = await getAbsolutePathAsync('/etc/group');
    const contentBlob = await readFile(path);
    let content = '';
    if (contentBlob instanceof Blob) {
      content = await contentBlob.text();
    } else {
      content = contentBlob as string;
    }

    if (!content) return [];

    const groups: string[] = [];
    const lines = content.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(':');
    if (parts.length < 4) continue;

    const groupName = parts[0];
    const members = parts[3].split(',').map(s => s.trim()).filter(Boolean);

    // User is a member if listed in the members field
    // OR if the group name matches the username (primary group)
    if (members.includes(username) || groupName === username) {
      groups.push(groupName);
    }
  }

  return groups;
  } catch {
    return [];
  }
}
