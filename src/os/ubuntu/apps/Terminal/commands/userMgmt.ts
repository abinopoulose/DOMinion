import type { CommandHandler } from './types';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
// import removed: useUbuntuVFSStore
import { getUserGroups } from '../../../services/sudoersParser';

/**
 * id — Print real and effective user and group IDs.
 *
 * Usage:
 *   id                Print current user's info
 *   id <username>     Print specific user's info
 *
 * Output format (matches real Linux):
 *   uid=1000(user) gid=1000(user) groups=1000(user),4(admin),27(sudo)
 */
export const id: CommandHandler = async (args, env, streams) => {
  const targetUser = args[0] || env?.effectiveUser || getAuthContext().username;

  const { readFile } = await import('../../../fs/operations');
  let passwdContent = '';
  try {
    const blob = await readFile('/etc/passwd');
    passwdContent = await blob.text();
  } catch (e) {
    [`uid=1000(${targetUser}) gid=1000(${targetUser}) groups=1000(${targetUser})`].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  const lines = passwdContent.split('\n');
  const userLine = lines.find(l => l.startsWith(targetUser + ':'));

  if (!userLine) {
    [`id: '${targetUser}': no such user`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const parts = userLine.split(':');
  const uid = parts[2];
  const gid = parts[3];

  const groups = await getUserGroups(targetUser);
  
  let groupContent = '';
  try {
    const groupBlob = await readFile('/etc/group');
    groupContent = await groupBlob.text();
  } catch (e) {}

  const groupStr = groups.map((g, i) => {
    if (groupContent) {
      const groupLines = groupContent.split('\n');
      const groupLine = groupLines.find(l => l.startsWith(g + ':'));
      if (groupLine) {
        const groupGid = groupLine.split(':')[2];
        return `${groupGid}(${g})`;
      }
    }
    return `${1000 + i}(${g})`;
  }).join(',');

  [`uid=${uid}(${targetUser}) gid=${gid}(${targetUser}) groups=${groupStr}`].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

/**
 * groups — Print group memberships for a user.
 *
 * Usage:
 *   groups              Print current user's groups
 *   groups <username>    Print specific user's groups
 */
export const groups: CommandHandler = async (args, env, streams) => {
  const targetUser = args[0] || env?.effectiveUser || getAuthContext().username;
  const userGroups = await getUserGroups(targetUser);

  if (userGroups.length === 0) {
    [targetUser].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  [`${targetUser} : ${userGroups.join(' ')}`].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

/**
 * passwd — Change user password.
 *
 * Usage:
 *   passwd              Change own password
 *   passwd <username>    Change another user's password (root only)
 *
 * NOTE: This is a simplified simulation. In real Linux, passwd is interactive
 * (prompts for old password, new password, confirm). For our simulation,
 * we output educational information about what would happen.
 */
export const passwd: CommandHandler = (args, env, streams) => {
  const username = env?.effectiveUser || getAuthContext().username;
  const targetUser = args[0] || username;

  if (targetUser !== username && username !== 'root') {
    ['passwd: You may not view or modify password information for other users.'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  [`passwd: Changing password for ${targetUser}.`].forEach((line: string) => streams.stdout.writeLine(line));
  [`(interactive password change not supported in this version)`].forEach((line: string) => streams.stdout.writeLine(line));

  return 0;
};

/**
 * adduser — Add a new user (root only).
 *
 * Usage:
 *   adduser <username>
 *
 * Educational output showing what would happen.
 */
export const adduser: CommandHandler = (args, env, streams) => {
  const username = env?.effectiveUser || getAuthContext().username;

  if (username !== 'root') {
    ['adduser: Only root may add a user or group to the system.'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  if (args.length === 0) {
    ['adduser: Only one or two names allowed.'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const newUser = args[0];

  [
    `Adding user '${newUser}' ...`,
    `Adding new group '${newUser}' (1002) ...`,
    `Adding new user '${newUser}' (1002) with group '${newUser}' ...`,
    `Creating home directory '/home/${newUser}' ...`,
    `Copying files from '/etc/skel' ...`,
    '',
    '(interactive user creation not yet fully implemented)',
    '',
    'In a real Linux system, this would also:',
    '  1. Prompt for a password for the new user',
    '  2. Ask for full name, room number, etc. (GECOS fields)',
    '  3. Create the home directory with default files',
    '  4. Add entries to /etc/passwd, /etc/shadow, /etc/group',
  ].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};
