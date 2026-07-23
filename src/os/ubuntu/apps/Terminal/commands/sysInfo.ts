import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';

export const APP_BOOT_TIME = Date.now();

export const whoami: CommandHandler = (_args, env, streams) => {
  const effectiveUser = env?.effectiveUser || getAuthContext().username;
  [effectiveUser].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const uname: CommandHandler = (args, _env, streams) => {
  const { flags } = parseArgs(args);

  const kernel = 'Linux';
  const hostname = localStorage.getItem('ubuntu-hostname') || 'envyy';
  const release = '6.8.0-31-generic';
  const full = `${kernel} ${hostname} ${release} #31-Ubuntu SMP x86_64 GNU/Linux`;

  if (flags.a) { [full].forEach((line: string) => streams.stdout.writeLine(line)); return 0; }
  if (flags.r) { [release].forEach((line: string) => streams.stdout.writeLine(line)); return 0; }
  if (flags.n) { [hostname].forEach((line: string) => streams.stdout.writeLine(line)); return 0; }
  [kernel].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const date: CommandHandler = (_args, _env, streams) => {
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

  const tzAbbr = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now)
    .find(p => p.type === 'timeZoneName')?.value || 'UTC';

  [`${day} ${month} ${dateNum} ${hours}:${minutes}:${seconds} ${tzAbbr} ${year}`].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const uptime: CommandHandler = (_args, _env, streams) => {
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

  [`${currentTime} up ${upStr}, 1 user, load average: ${load1}, ${load5}, ${load15}`].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const free: CommandHandler = (args, _env, streams) => {
  const { flags } = parseArgs(args);

  if (flags.h) {
    [
        '               total        used        free      shared  buff/cache   available',
        'Mem:            15Gi       4.2Gi       8.1Gi       312Mi       3.3Gi        10Gi',
        'Swap:          2.0Gi          0B       2.0Gi',
      ].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  [
      '               total        used        free      shared  buff/cache   available',
      'Mem:        16631808     4404019     8495104      319488     3732685    11104256',
      'Swap:        2097152           0     2097152',
    ].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const top: CommandHandler = (_args, _env, streams) => {
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
    ].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const df: CommandHandler = async (args, _env, streams) => {
  const { flags } = parseArgs(args);
  const isHuman = flags.h;
  
  // Real VFS statistics mock implementation
  // Actually checking all indexedDB keys might be slow, so we'll estimate or just show a fixed mock that looks real
  const totalK = 51200000;
  const usedK = 3456000;
  const availK = 47744000;
  const usePct = '7%';
  
  const tmpTotalK = 8126464;
  const tmpUsedK = 0;
  const tmpAvailK = 8126464;
  const tmpUsePct = '0%';
  
  if (isHuman) {
    streams.stdout.writeLine('Filesystem      Size  Used Avail Use% Mounted on');
    streams.stdout.writeLine(`/dev/vda1        49G  3.3G   46G   ${usePct} /`);
    streams.stdout.writeLine(`tmpfs           7.8G     0  7.8G   ${tmpUsePct} /dev/shm`);
  } else {
    streams.stdout.writeLine('Filesystem     1K-blocks      Used Available Use% Mounted on');
    streams.stdout.writeLine(`/dev/vda1       ${totalK}   ${usedK}  ${availK}   ${usePct} /`);
    streams.stdout.writeLine(`tmpfs            ${tmpTotalK}         ${tmpUsedK}   ${tmpAvailK}   ${tmpUsePct} /dev/shm`);
  }
  
  return 0;
};

export const lsblk: CommandHandler = (_args, _env, streams) => {
  const output = [
    'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS',
    'vda    254:0    0   50G  0 disk ',
    '└─vda1 254:1    0   50G  0 part /'
  ];
  output.forEach(l => streams.stdout.writeLine(l));
  return 0;
};

export const lscpu: CommandHandler = (_args, _env, streams) => {
  const cores = navigator.hardwareConcurrency || 4;
  const output = [
    'Architecture:            x86_64',
    '  CPU op-mode(s):        32-bit, 64-bit',
    '  Address sizes:         39 bits physical, 48 bits virtual',
    '  Byte Order:            Little Endian',
    `CPU(s):                  ${cores}`,
    `  On-line CPU(s) list:   0-${cores - 1}`,
    'Vendor ID:               AuthenticAMD',
    '  Model name:            AMD Ryzen Processor',
    '    CPU family:          25',
    '    Model:               33',
    '    Thread(s) per core:  2',
    '    Core(s) per socket:  ' + (cores / 2),
    '    Socket(s):           1',
    '    Stepping:            0',
    '    BogoMIPS:            7186.00',
    'Virtualization features: ',
    '  Virtualization:        AMD-V'
  ];
  output.forEach(l => streams.stdout.writeLine(l));
  return 0;
};

export const lsusb: CommandHandler = (_args, _env, streams) => {
  const output = [
    'Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub',
    'Bus 001 Device 003: ID 046d:c52b Logitech, Inc. Unifying Receiver',
    'Bus 001 Device 002: ID 8087:0029 Intel Corp. AX200 Bluetooth',
    'Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub'
  ];
  output.forEach(l => streams.stdout.writeLine(l));
  return 0;
};

export const dmesg: CommandHandler = (_args, _env, streams) => {
  const output = [
    '[    0.000000] Linux version 6.8.0-31-generic (buildd@lcy02-amd64-077) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0, GNU ld (GNU Binutils for Ubuntu) 2.42) #31-Ubuntu SMP PREEMPT_DYNAMIC Sat Apr 20 00:40:06 UTC 2024 (Ubuntu 6.8.0-31.31-generic 6.8.1)',
    '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-31-generic root=UUID=1234 ro quiet splash',
    '[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'',
    '[    0.000000] x86/fpu: Supporting XSAVE feature 0x002: \'SSE registers\'',
    '[    0.000000] x86/fpu: Supporting XSAVE feature 0x004: \'AVX registers\'',
    '[    0.000000] BIOS-provided physical RAM map:',
    '[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
    '[    0.000000] BIOS-e820: [mem 0x000000000009fc00-0x000000000009ffff] reserved',
    '[    0.000000] BIOS-e820: [mem 0x00000000000e0000-0x00000000000fffff] reserved',
    '[    0.000000] NX (Execute Disable) protection: active',
    '[    0.000000] SMBIOS 3.3.0 present.',
    '[    0.000000] DMI: QEMU Standard PC (Q35 + ICH9, 2009), BIOS 1.16.2-debian-1.16.2-1 04/01/2014',
    '[    0.004012] secureboot: Secure boot could not be determined',
    '[    0.004012] tsc: Fast TSC calibration using PIT',
    '[    0.005014] tsc: Detected 3593.218 MHz processor'
  ];
  output.forEach(l => streams.stdout.writeLine(l));
  return 0;
};

export const systemctl: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stdout.writeLine('UNIT            LOAD   ACTIVE SUB     DESCRIPTION');
    streams.stdout.writeLine('cron.service    loaded active running Regular background program processing daemon');
    streams.stdout.writeLine('dbus.service    loaded active running D-Bus System Message Bus');
    streams.stdout.writeLine('network.service loaded active running Network Connectivity');
    streams.stdout.writeLine('ssh.service     loaded active running OpenBSD Secure Shell server');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('LOAD   = Reflects whether the unit definition was properly loaded.');
    streams.stdout.writeLine('ACTIVE = The high-level unit activation state, i.e. generalization of SUB.');
    streams.stdout.writeLine('SUB    = The low-level unit activation state, values depend on unit type.');
    streams.stdout.writeLine('4 loaded units listed.');
    return 0;
  }
  
  const action = args[0];
  const service = args[1];
  
  if (!service && action !== 'list-units') {
    streams.stderr.writeLine(`systemctl: missing service name`);
    return 1;
  }
  
  if (action === 'status') {
    streams.stdout.writeLine(`● ${service}.service - ${service} service`);
    streams.stdout.writeLine(`     Loaded: loaded (/lib/systemd/system/${service}.service; enabled; preset: enabled)`);
    streams.stdout.writeLine(`     Active: active (running) since ${new Date().toISOString()}`);
    streams.stdout.writeLine(`       Docs: man:${service}(8)`);
    streams.stdout.writeLine(`   Main PID: ${Math.floor(Math.random() * 5000) + 100} (${service})`);
    streams.stdout.writeLine(`      Tasks: 1 (limit: 18783)`);
    streams.stdout.writeLine(`     Memory: 2.3M`);
    streams.stdout.writeLine(`        CPU: 12ms`);
    streams.stdout.writeLine(`     CGroup: /system.slice/${service}.service`);
    streams.stdout.writeLine(`             └─${Math.floor(Math.random() * 5000) + 100} /usr/sbin/${service}`);
  } else if (action === 'start' || action === 'restart') {
    streams.stdout.writeLine(`==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ===`);
    streams.stdout.writeLine(`Authentication is required to start '${service}.service'.`);
    streams.stdout.writeLine(`Authenticating as: root`);
    streams.stdout.writeLine(`==== AUTHENTICATION COMPLETE ===`);
  } else if (action === 'stop') {
    streams.stdout.writeLine(`==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ===`);
    streams.stdout.writeLine(`Authentication is required to stop '${service}.service'.`);
    streams.stdout.writeLine(`Authenticating as: root`);
    streams.stdout.writeLine(`==== AUTHENTICATION COMPLETE ===`);
  } else if (action === 'list-units') {
    return systemctl([], _env, streams);
  } else {
    streams.stderr.writeLine(`Unknown operation '${action}'.`);
    return 1;
  }
  
  return 0;
};
