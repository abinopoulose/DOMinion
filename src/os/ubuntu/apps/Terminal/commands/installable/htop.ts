import type { CommandHandler } from '../types';
import { getDynamicHardwareConfig } from '../../../../../../hardware/hardwareConfig';
import { useProcessManager } from '../../../../services/ProcessManager';
import { APP_REGISTRY } from '../../../../config/appRegistry';

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
  
  // Try to parse total memory in GB
  let totalMemGb = 16.0;
  const memMatch = memoryDisplay.match(/(\d+(?:\.\d+)?)\s*G/i);
  if (memMatch && memMatch[1]) {
    totalMemGb = parseFloat(memMatch[1]);
  }

  streams.stdout.write('\x1b[2J\x1b[H'); // Initial clear

  // Memory usage cache to make the numbers stable but slightly fluctuating
  const processStatsCache = new Map<number, { cpu: number, mem: number, virt: string, res: string, shr: string, cmd: string }>();

  const getProcessCommand = (appId: string) => {
    if (APP_REGISTRY[appId]) return APP_REGISTRY[appId].processCmd;
    const map: Record<string, string> = {
      'systemd': '/lib/systemd/systemd --user',
      'kthreadd': '[kthreadd]',
      'dominion-wm': '/usr/bin/dominion-wm',
      'Xorg': '/usr/lib/xorg/Xorg -core :0 -seat',
      'gnome-shell': '/usr/bin/gnome-shell'
    };
    return map[appId] || `/usr/bin/${appId}`;
  };

  const getProcessBaseUsage = (appId: string) => {
    if (APP_REGISTRY[appId]) return APP_REGISTRY[appId].baseUsage;
    const map: Record<string, { cpu: number, mem: number }> = {
      'gnome-shell': { cpu: 3.0, mem: 1.2 },
      'Xorg': { cpu: 1.5, mem: 1.8 },
      'systemd': { cpu: 0.1, mem: 0.1 }
    };
    return map[appId] || { cpu: 0.5, mem: 0.2 };
  };

  const render = () => {
    // 1. Fetch real processes
    const rawProcesses = useProcessManager.getState().processes;
    
    // We add some essential OS processes if they don't exist
    const baseOsProcesses = ['gnome-shell', 'Xorg'];
    const runningApps = rawProcesses.map(p => p.name);
    
    // Create the full list
    const processesToRender: Array<{ pid: number, user: string, pri: string, ni: string, state: string, name: string, time: number }> = [
      ...rawProcesses.map(p => ({
        pid: p.pid, user: p.user, pri: '20', ni: '0', state: p.state === 'running' ? 'S' : 'I', name: p.name, time: Date.now() - p.startTime
      }))
    ];
    
    baseOsProcesses.forEach((pName, idx) => {
      if (!runningApps.includes(pName)) {
        processesToRender.push({
          pid: 1000 + idx, user: 'root', pri: '20', ni: '0', state: 'S', name: pName, time: 3600000 + (Math.random() * 10000)
        });
      }
    });
    
    // Inject htop itself
    processesToRender.push({
      pid: 2459, user: 'abino', pri: '20', ni: '0', state: 'R', name: 'htop', time: 1000
    });

    let totalMemUsageGb = 0.5; // OS baseline overhead
    let totalCpuUsage = 0;

    // 2. Assign and format metrics
    const formattedProcesses = processesToRender.map(p => {
      let stats = processStatsCache.get(p.pid);
      if (!stats) {
        const base = getProcessBaseUsage(p.name);
        stats = {
          cpu: base.cpu + (Math.random() * 0.5),
          mem: base.mem + (Math.random() * 0.1),
          virt: Math.floor(Math.random() * 2000 + 100).toString() + 'M',
          res: Math.floor(Math.random() * 200 + 50).toString() + 'M',
          shr: Math.floor(Math.random() * 80 + 10).toString() + 'M',
          cmd: getProcessCommand(p.name)
        };
      } else {
        // slightly fluctuate
        stats.cpu = Math.max(0, stats.cpu + (Math.random() * 0.4 - 0.2));
      }
      
      if (p.name === 'htop') stats.cpu = 1.0 + Math.random(); 

      processStatsCache.set(p.pid, stats);

      totalMemUsageGb += stats.mem;
      totalCpuUsage += stats.cpu;

      const timeMins = Math.floor(p.time / 60000);
      const timeSecs = Math.floor((p.time % 60000) / 1000).toString().padStart(2, '0');
      const timeStr = `${timeMins}:${timeSecs}.${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;

      return {
        ...p,
        cpuPercent: stats.cpu,
        memPercent: (stats.mem / totalMemGb) * 100,
        virt: stats.virt,
        res: stats.res,
        shr: stats.shr,
        cmd: stats.cmd,
        timeStr
      };
    });

    // Sort by CPU desc
    formattedProcesses.sort((a, b) => b.cpuPercent - a.cpuPercent);

    // 3. Render Header
    const cpuLines = [];
    for (let i = 1; i <= cores; i++) {
      let usage = (totalCpuUsage / cores) + (Math.random() * 2); // Add some noise
      if (usage > 100) usage = 100;
      if (usage < 0) usage = 0.1;
      
      const barLength = Math.floor(usage / 2);
      const bar = `\x1b[32m${'|'.repeat(Math.max(1, barLength - 2))}\x1b[31m${'|'.repeat(Math.min(2, barLength))}\x1b[0m`;
      const paddedBar = bar.padEnd(50, ' ');
      cpuLines.push(`\x1b[36m ${i.toString().padStart(2, ' ')}  \x1b[0m[${paddedBar} ${usage.toFixed(1)}%]`);
    }

    if (totalMemUsageGb > totalMemGb) totalMemUsageGb = totalMemGb - 0.5;
    
    const memoryBarLength = Math.floor((totalMemUsageGb / totalMemGb) * 40);
    const memoryBar = `\x1b[32m${'|'.repeat(Math.max(1, memoryBarLength - 4))}\x1b[33m|||\x1b[31m|\x1b[0m`;

    const load1 = (totalCpuUsage / 100).toFixed(2);
    const load5 = ((totalCpuUsage / 100) * 0.9).toFixed(2);
    const load15 = ((totalCpuUsage / 100) * 0.85).toFixed(2);

    const output = [
      ...cpuLines,
      `\x1b[36m Mem \x1b[0m[${memoryBar.padEnd(50, ' ')} ${totalMemUsageGb.toFixed(2)}G/${memoryDisplay}]`,
      `\x1b[36m Swp \x1b[0m[${' '.padEnd(41, ' ')} 0K/2.00G]`,
      '',
      `  Tasks: \x1b[32m${formattedProcesses.length + 80}\x1b[0m, \x1b[33m294\x1b[0m thr; \x1b[32m1\x1b[0m running`,
      `  Load average: \x1b[32m${load1} ${load5} ${load15}\x1b[0m`,
      `  Uptime: \x1b[32m03:14:15\x1b[0m`,
      '',
      `\x1b[7m    PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command                            \x1b[0m`
    ];

    // 4. Render process rows
    formattedProcesses.forEach(p => {
      const pid = p.pid.toString().padStart(6, ' ');
      const user = p.user.padEnd(9, ' ');
      const pri = p.pri.padStart(3, ' ');
      const ni = p.ni.padStart(3, ' ');
      const virt = p.virt.padStart(5, ' ');
      const res = p.res.padStart(5, ' ');
      const shr = p.shr.padStart(5, ' ');
      const s = p.state;
      const cpu = p.cpuPercent.toFixed(1).padStart(4, ' ');
      const mem = p.memPercent.toFixed(1).padStart(4, ' ');
      const time = p.timeStr.padStart(8, ' ');
      const cmd = p.cmd;
      
      output.push(`${pid} ${user} ${pri} ${ni} ${virt} ${res} ${shr} ${s} ${cpu} ${mem} ${time} ${cmd}`);
    });

    streams.stdout.write('\x1b[H'); // Home cursor
    output.forEach(line => streams.stdout.writeLine(line));
    streams.stdout.write('\x1b[J'); // Clear anything below
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
