import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';

/**
 * Timestamp when the application booted (module-level constant).
 * Used by `uptime` and `top` to calculate elapsed time.
 */
export const APP_BOOT_TIME = Date.now();

/**
 * whoami — Print effective username.
 * Real Ubuntu default user for desktop is the user's name,
 * but our simulation uses "ubuntu" as the canonical user.
 */
export const whoami: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, appState, process) => {
  // If running under su, use the effective user
  const effectiveUser = appState?.effectiveUser || getAuthContext().username;
  [effectiveUser].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * uname — Print system information.
 *
 * Flags:
 *   -s  Kernel name (default if no flags)
 *   -n  Network hostname
 *   -r  Kernel release
 *   -a  All information
 */
export const uname: CommandHandler = (args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags } = parseArgs(args);

  const kernel = 'Linux';
  const hostname = 'ubuntu-web';
  const release = '6.8.0-31-generic';
  const full = `${kernel} ${hostname} ${release} #31-Ubuntu SMP x86_64 GNU/Linux`;

  if (flags.a) { [full].forEach((line: string) => process.stdout.writeLine(line)); return {}; }
  if (flags.r) { [release].forEach((line: string) => process.stdout.writeLine(line)); return {}; }
  if (flags.n) { [hostname].forEach((line: string) => process.stdout.writeLine(line)); return {}; }
  // Default: -s or no flags → kernel name
  [kernel].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * date — Display the current date and time.
 * Format matches Ubuntu default: "Mon Jun 30 14:02:59 IST 2026"
 */
export const date: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const dateNum = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const year = now.getFullYear();

  // Get timezone abbreviation
  const tzAbbr = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now)
    .find(p => p.type === 'timeZoneName')?.value || 'UTC';

  [`${day} ${month} ${dateNum} ${hours}:${minutes}:${seconds} ${tzAbbr} ${year}`].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * uptime — Show how long the system has been running.
 * Uses APP_BOOT_TIME to calculate elapsed time since the page was loaded.
 * Format: "14:02:59 up 3:14, 1 user, load average: 0.42, 0.35, 0.30"
 */
export const uptime: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const now = new Date();
  const elapsed = Date.now() - APP_BOOT_TIME;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;

  const upHours = Math.floor(elapsed / (1000 * 60 * 60));
  const upMinutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const upStr = `${upHours}:${upMinutes.toString().padStart(2, '0')}`;

  // Static mock load averages (slightly randomised for realism)
  const load1 = (0.3 + Math.random() * 0.3).toFixed(2);
  const load5 = (0.25 + Math.random() * 0.2).toFixed(2);
  const load15 = (0.2 + Math.random() * 0.2).toFixed(2);

  [`${currentTime} up ${upStr}, 1 user, load average: ${load1}, ${load5}, ${load15}`].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * free — Display amount of free and used memory in the system.
 * Returns a static mock table. Supports -h (human-readable).
 */
export const free: CommandHandler = (args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags } = parseArgs(args);

  if (flags.h) {
    [
        '               total        used        free      shared  buff/cache   available',
        'Mem:            15Gi       4.2Gi       8.1Gi       312Mi       3.3Gi        10Gi',
        'Swap:          2.0Gi          0B       2.0Gi',
      ].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  [
      '               total        used        free      shared  buff/cache   available',
      'Mem:        16631808     4404019     8495104      319488     3732685    11104256',
      'Swap:        2097152           0     2097152',
    ].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * top — Display a static snapshot of system processes.
 * Uses real uptime from APP_BOOT_TIME for the header line.
 * The process table is a hardcoded mock.
 */
export const top: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const now = new Date();
  const elapsed = Date.now() - APP_BOOT_TIME;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;

  const upHours = Math.floor(elapsed / (1000 * 60 * 60));
  const upMinutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const upStr = `${upHours}:${upMinutes.toString().padStart(2, '0')}`;

  const load1 = (0.3 + Math.random() * 0.3).toFixed(2);
  const load5 = (0.25 + Math.random() * 0.2).toFixed(2);
  const load15 = (0.2 + Math.random() * 0.2).toFixed(2);

  [
      `top - ${currentTime} up ${upStr},  1 user,  load average: ${load1}, ${load5}, ${load15}`,
      'Tasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie',
      `%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.5 id,  0.3 wa,  0.0 hi,  0.1 si`,
      'MiB Mem :  15876.4 total,   8312.0 free,   4301.2 used,   3263.2 buff/cache',
      'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.  10547.3 avail Mem',
      '',
      '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      '    1 root      20   0  169412  13120   8448 S   0.0   0.1   0:02.34 systemd',
      '  412 root      20   0   43256   5632   3456 S   0.0   0.0   0:00.12 cron',
      ' 1024 ubuntu    20   0  724800  52480  38912 S   1.2   0.3   0:15.67 gnome-shell',
      ' 2048 ubuntu    20   0  312456  28672  20480 S   0.3   0.2   0:04.21 firefox',
      ' 3072 ubuntu    20   0   45612  12288   8192 S   0.1   0.1   0:01.45 gnome-terminal',
      ' 4096 ubuntu    20   0  256000  32768  24576 S   0.0   0.2   0:03.89 nautilus',
    ].forEach((line: string) => process.stdout.writeLine(line)); return {};
};
