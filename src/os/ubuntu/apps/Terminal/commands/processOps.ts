import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';
import { useWindowStore } from '../../../store/useUbuntuWindowStore';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';

export const ps: CommandHandler = (args, env, streams) => {
  const { flags } = parseArgs(args);
  const isAux = flags.a || flags.u || flags.x;
  
  if (isAux) {
    streams.stdout.writeLine('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
    streams.stdout.writeLine('root           1  0.0  0.1 169412 13120 ?        Ss   00:00   0:02 /sbin/init');
    streams.stdout.writeLine('root         412  0.0  0.0  43256  5632 ?        Ss   00:00   0:00 /usr/sbin/cron -f');
  } else {
    streams.stdout.writeLine('    PID TTY          TIME CMD');
  }

  const windows = useWindowStore.getState().windows;
  const username = env?.effectiveUser || getAuthContext().username;
  
  let fakePidStart = 1000;
  
  for (const w of windows) {
    const pid = fakePidStart++;
    if (isAux) {
      streams.stdout.writeLine(`${username.padEnd(8)} ${pid.toString().padStart(6)}  0.5  0.2 312456 28672 tty1     S    00:01   0:04 ${w.appId} (${w.id})`);
    } else {
      streams.stdout.writeLine(`${pid.toString().padStart(7)} tty1     00:00:04 ${w.appId}`);
    }
  }
  
  // Also add bash and ps
  const bashPid = fakePidStart++;
  const psPid = fakePidStart++;
  
  if (isAux) {
    streams.stdout.writeLine(`${username.padEnd(8)} ${bashPid.toString().padStart(6)}  0.0  0.0  45612 12288 pts/0    Ss   00:05   0:00 bash`);
    streams.stdout.writeLine(`${username.padEnd(8)} ${psPid.toString().padStart(6)}  0.0  0.0  12348  3212 pts/0    R+   00:05   0:00 ps ${args.join(' ')}`);
  } else {
    streams.stdout.writeLine(`${bashPid.toString().padStart(7)} pts/0    00:00:00 bash`);
    streams.stdout.writeLine(`${psPid.toString().padStart(7)} pts/0    00:00:00 ps`);
  }

  return 0;
};

export const kill: CommandHandler = (args, _env, streams) => {
  const { positional } = parseArgs(args);
  if (positional.length === 0) {
    streams.stderr.writeLine('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]');
    return 1;
  }
  
  const pidTarget = positional[positional.length - 1]; // Naive way to get pid, ignoring flags for a bit
  const windows = useWindowStore.getState().windows;
  
  // In our fake mapping, window PIDs start from 1000 and go up to 1000+N-1 sequentially.
  // Alternatively, the user might provide the window UUID directly (a bit cheating, but works).
  const targetNum = parseInt(pidTarget, 10);
  
  if (!isNaN(targetNum) && targetNum >= 1000 && targetNum < 1000 + windows.length) {
    const windowToKill = windows[targetNum - 1000];
    if (windowToKill) {
      useWindowStore.getState().closeWindow(windowToKill.id);
      return 0;
    }
  } else if (windows.some(w => w.id === pidTarget)) {
    useWindowStore.getState().closeWindow(pidTarget);
    return 0;
  } else if (targetNum === 1 || targetNum === 412) {
    streams.stderr.writeLine(`kill: (1) - Operation not permitted`);
    return 1;
  }
  
  streams.stderr.writeLine(`bash: kill: (${pidTarget}) - No such process`);
  return 1;
};

export const jobs: CommandHandler = (_args, _env, _streams) => {
  return 0; // Simulated empty jobs list
};

export const fg: CommandHandler = (args, _env, streams) => {
  streams.stderr.writeLine(`bash: fg: ${args[0] || 'current'}: no such job`);
  return 1;
};

export const bg: CommandHandler = (args, _env, streams) => {
  streams.stderr.writeLine(`bash: bg: ${args[0] || 'current'}: no such job`);
  return 1;
};

export const nohup: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('nohup: missing operand');
    streams.stderr.writeLine(`Try 'nohup --help' for more information.`);
    return 1;
  }
  
  streams.stderr.writeLine(`nohup: ignoring input and appending output to 'nohup.out'`);
  
  // Since we don't have a real background job runner, we just run the command synchronously.
  // We should ideally run it and pipe its stdout to nohup.out
  const { commandRegistry } = await import('./index');
  const cmdName = args[0];
  const cmdArgs = args.slice(1);
  
  const handler = commandRegistry[cmdName];
  if (!handler) {
    streams.stderr.writeLine(`nohup: failed to run command '${cmdName}': No such file or directory`);
    return 127;
  }
  
  // Mock standard streams for nohup to pipe output to nohup.out
  let outContent = '';
  const dummyStream = {
    write: (data: string) => outContent += data,
    writeLine: (data: string) => outContent += data + '\n',
    readAll: () => '',
    readLines: () => [],
    appendToBuffer: () => {},
    onData: () => () => {},
    clearListeners: () => {}
  } as any;
  
  const mockStreams = {
    stdin: streams.stdin,
    stdout: dummyStream,
    stderr: dummyStream
  };
  
  let exitCode = 0;
  try {
    if (typeof handler === 'function') {
       exitCode = await handler(cmdArgs, env, mockStreams) ?? 0;
    } else if (typeof handler === 'object' && 'run' in handler) {
       exitCode = await (handler as any).run(cmdArgs, env, mockStreams) ?? 0;
    }
  } catch (err: any) {
    outContent += err.message + '\n';
    exitCode = 1;
  }
  
  try {
    const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
    const { writeFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    await writeFile(`${cwdPath === '/' ? '' : cwdPath}/nohup.out`, outContent, { append: true });
  } catch {}
  
  return exitCode;
};

export const xargs: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['n']);
  
  if (positional.length === 0) {
    positional.push('echo');
  }
  
  const cmdName = positional[0];
  const initialArgs = positional.slice(1);
  const n = parseInt(options.n || '0', 10);
  
  const stdinContent = streams.stdin.readAll().trim();
  if (!stdinContent) return 0;
  
  const tokens = stdinContent.split(/\s+/).filter(Boolean);
  const { commandRegistry } = await import('./index');
  const handler = commandRegistry[cmdName];
  
  if (!handler) {
    streams.stderr.writeLine(`xargs: ${cmdName}: No such file or directory`);
    return 127;
  }
  
  let exitCode = 0;
  
  const batchSize = n > 0 ? n : tokens.length;
  
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    const cmdArgs = [...initialArgs, ...batch];
    
    try {
      if (typeof handler === 'function') {
         exitCode = await handler(cmdArgs, env, streams) ?? 0;
      } else if (typeof handler === 'object' && 'run' in handler) {
         exitCode = await (handler as any).run(cmdArgs, env, streams) ?? 0;
      }
    } catch (err: any) {
      streams.stderr.writeLine(err.message);
      exitCode = 1;
    }
    
    if (exitCode !== 0) break;
  }
  
  return exitCode;
};
