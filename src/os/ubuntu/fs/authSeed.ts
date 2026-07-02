import { UBUNTU_ACCOUNTS } from '../../../config/accounts';
import { hashPassword } from '../utils/passwordHasher';

/**
 * Generate /etc/passwd content.
 * Format (per line): username:x:uid:gid:gecos:home:shell
 *
 * Real Ubuntu passwd file reference:
 *   root:x:0:0:root:/root:/bin/bash
 *   user:x:1000:1000:User Name:/home/user:/bin/bash
 */
export function generatePasswdContent(): string {
  const lines: string[] = [
    'root:x:0:0:root:/root:/bin/bash',
  ];

  let uid = 1000;
  for (const account of UBUNTU_ACCOUNTS) {
    const gecos = account.username.charAt(0).toUpperCase() + account.username.slice(1);
    lines.push(`${account.username}:x:${uid}:${uid}:${gecos}:/home/${account.username}:/bin/bash`);
    uid++;
  }

  // System accounts (non-interactive)
  lines.push('nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin');

  return lines.join('\n') + '\n';
}

/**
 * Generate /etc/shadow content.
 * Format: username:password_hash:lastchanged:min:max:warn:inactive:expire:
 *
 * For the simulation, we store passwords with a simple prefix-hash format:
 *   $SIM$salt$hash
 *
 * This mimics the real $6$salt$hash (SHA-512) format visually.
 * The actual hashing is done by the PasswordHasher utility (Task 2).
 *
 * IMPORTANT: On first seed, we use a placeholder that gets replaced
 * when PasswordHasher is implemented in Task 2. Until then, the system
 * falls back to plaintext comparison from config/accounts.ts.
 */
export function generateShadowContent(): string {
  const lines: string[] = [
    'root:!:19900:0:99999:7:::',  // root account locked by default (like real Ubuntu)
  ];

  const today = Math.floor(Date.now() / 86400000); // days since epoch

  for (const account of UBUNTU_ACCOUNTS) {
    // Placeholder hash — Task 2 will replace with actual SHA-256 hash
    lines.push(`${account.username}:$PLAIN$${account.password}:${today}:0:99999:7:::`);
  }

  lines.push('nobody:*:19900:0:99999:7:::');

  return lines.join('\n') + '\n';
}

/**
 * Generate shadow content with proper hashed passwords.
 * This is async because Web Crypto's digest is async.
 *
 * Called during VFS seed to produce hashed passwords instead of $PLAIN$ placeholders.
 */
export async function generateHashedShadowContent(): Promise<string> {
  const today = Math.floor(Date.now() / 86400000);
  const lines: string[] = [
    'root:!:19900:0:99999:7:::',
  ];

  for (const account of UBUNTU_ACCOUNTS) {
    const hash = await hashPassword(account.password);
    lines.push(`${account.username}:${hash}:${today}:0:99999:7:::`);
  }

  lines.push('nobody:*:19900:0:99999:7:::');
  return lines.join('\n') + '\n';
}

/**
 * Generate /etc/sudoers content.
 * This is a simplified but educationally accurate sudoers file.
 *
 * Real sudoers format reference:
 *   root    ALL=(ALL:ALL) ALL
 *   %admin  ALL=(ALL) ALL
 *   %sudo   ALL=(ALL:ALL) ALL
 *   user    ALL=(ALL) NOPASSWD: /usr/bin/apt
 */
export function generateSudoersContent(): string {
  const lines: string[] = [
    '#',
    '# This file MUST be edited with the \'visudo\' command as root.',
    '#',
    '# See the man page for details on how to write a sudoers file.',
    '#',
    '',
    '# Defaults',
    'Defaults\tenv_reset',
    'Defaults\tmail_badpass',
    'Defaults\tsecure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"',
    'Defaults\ttimestamp_timeout=15',
    '',
    '# Root can do anything',
    'root\tALL=(ALL:ALL) ALL',
    '',
    '# Members of the admin group may gain root privileges',
    '%admin\tALL=(ALL) ALL',
    '',
    '# Members of the sudo group may execute any command',
    '%sudo\tALL=(ALL:ALL) ALL',
    '',
    '# Per-user rules (generated from accounts config)',
  ];

  for (const account of UBUNTU_ACCOUNTS) {
    if (account.role === 'admin') {
      lines.push(`${account.username}\tALL=(ALL:ALL) ALL`);
    }
  }

  lines.push('');
  return lines.join('\n') + '\n';
}

/**
 * Generate /etc/group content.
 * Format: groupname:x:gid:members
 */
export function generateGroupContent(): string {
  const adminUsers = UBUNTU_ACCOUNTS
    .filter(a => a.role === 'admin')
    .map(a => a.username);

  const lines: string[] = [
    'root:x:0:',
    `admin:x:4:${adminUsers.join(',')}`,
    `sudo:x:27:${adminUsers.join(',')}`,
  ];

  let gid = 1000;
  for (const account of UBUNTU_ACCOUNTS) {
    lines.push(`${account.username}:x:${gid}:${account.username}`);
    gid++;
  }

  lines.push('nogroup:x:65534:');
  lines.push('');
  return lines.join('\n') + '\n';
}
