import type { CommandHandler } from '../types';
import { getDynamicHardwareConfig } from '../../../../../../hardware/hardwareConfig';

export const htop: CommandHandler = async (_args, env, streams) => {
  const config = await getDynamicHardwareConfig();
  
  // Parse processor count (default to 4 if parse fails)
  let cores = 4;
  const coreMatch = config.processor.match(/(\d+)\s*Cores?/i) || config.processor.match(/×\s*(\d+)/i);
  if (coreMatch && coreMatch[1]) {
    cores = parseInt(coreMatch[1], 10);
  }
  // Cap at 16 for display purposes
  if (cores > 16) cores = 16;
  if (cores < 1) cores = 1;
  const memoryDisplay = config.memory.replace(' GiB', 'G');

  streams.stdout.write('\x1b[2J\x1b[H'); // Initial clear

  const render = () => {
    const cpuLines = [];
    for (let i = 1; i <= cores; i++) {
      const usage = Math.floor(Math.random() * 30) + 1;
      const barLength = Math.floor(usage / 2);
      const bar = `\x1b[32m${'|'.repeat(Math.max(1, barLength - 2))}\x1b[31m${'|'.repeat(Math.min(2, barLength))}\x1b[0m`;
      const paddedBar = bar.padEnd(50, ' ');
      cpuLines.push(`\x1b[36m ${i.toString().padStart(2, ' ')}  \x1b[0m[${paddedBar} ${usage.toFixed(1)}%]`);
    }

    const memUsage = (Math.random() * 0.5 + 1.5).toFixed(2);
    const memoryBarLength = Math.floor(parseFloat(memUsage) / 16 * 40);
    const memoryBar = `\x1b[32m${'|'.repeat(Math.max(1, memoryBarLength - 4))}\x1b[33m|||\x1b[31m|\x1b[0m`;
    
    const gnomeCpu = (2.0 + Math.random() * 1.5).toFixed(1);
    const xorgCpu = (1.0 + Math.random() * 0.8).toFixed(1);

    const output = [
      ...cpuLines,
      `\x1b[36m Mem \x1b[0m[${memoryBar.padEnd(50, ' ')} ${memUsage}G/${memoryDisplay}]`,
      `\x1b[36m Swp \x1b[0m[${' '.padEnd(41, ' ')} 0K/2.00G]`,
      '',
      `  Tasks: \x1b[32m124\x1b[0m, \x1b[33m380\x1b[0m thr; \x1b[32m2\x1b[0m running`,
      `  Load average: \x1b[32m1.04 1.15 1.09\x1b[0m`,
      `  Uptime: \x1b[32m03:14:15\x1b[0m`,
      '',
      `\x1b[7m    PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command                            \x1b[0m`,
      `   1823 root       20   0 1383M  146M 87244 S  ${gnomeCpu.padStart(3, ' ')}  0.9  0:11.23 /usr/bin/gnome-shell               `,
      `   1955 root       20   0 3244M  212M  102M S  ${xorgCpu.padStart(3, ' ')}  1.3  0:05.41 /usr/lib/xorg/Xorg -core :0 -seat  `,
      `    834 systemd    20   0  125M 11216  8332 S  0.0  0.1  0:00.32 /lib/systemd/systemd-journald      `,
      `      1 root       20   0  166M 11400  8400 S  0.0  0.1  0:02.14 /sbin/init splah                   `,
      `   1200 root       20   0  204K  124K   80K R  0.0  0.0  0:00.01 htop                               `
    ];

    streams.stdout.write('\x1b[H'); // Home cursor (avoids flicker)
    output.forEach(line => streams.stdout.writeLine(line));
  };

  render();
  const interval = setInterval(render, 1000);

  // Wait for user to press Q or Ctrl+C
  await new Promise<void>((resolve) => {
    const handleAbort = () => resolve();
    if (env.abortSignal) {
      env.abortSignal.addEventListener('abort', handleAbort);
    }
    
    env.onRawKey = (key: string) => {
      if (key === 'q' || key === 'Q' || key === '\x1b[21~') {
        resolve();
      }
    };
  });
  
  clearInterval(interval);
  env.onRawKey = undefined; // clean up

  streams.stdout.write('\x1b[2J\x1b[H'); // Clear before exit
  return 0;
};
