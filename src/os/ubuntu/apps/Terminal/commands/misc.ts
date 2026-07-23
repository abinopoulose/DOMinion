import type { CommandHandler } from './types';
// import removed: useVFSStore
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { useHardwareStore } from '../../../../../hardware/store/useHardwareStore';


export const echo: CommandHandler = (args, _env, streams) => {
  let isNewline = true;
  let isEscaped = false;
  let printArgs = args;

  if (args.length > 0 && args[0].startsWith('-')) {
    if (args[0].includes('n')) isNewline = false;
    if (args[0].includes('e')) isEscaped = true;
    
    // Remove the flag argument if it matches -n, -e, or -ne / -en
    if (/^-[ne]+$/.test(args[0])) {
      printArgs = args.slice(1);
    }
  }

  let text = printArgs.join(' ');
  if (isEscaped) {
    text = text
      .replace(/\\e/g, '\x1b')
      .replace(/\\033/g, '\x1b')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
  }

  if (isNewline) {
    streams.stdout.writeLine(text);
  } else {
    streams.stdout.write(text);
  }
  return 0;
};

export const clear: CommandHandler = (_args, _env, streams) => {
  streams.stdout.write('\x1b[2J\x1b[3J\x1b[H');
  return 0;
};

export const reset: CommandHandler = (_args, _env, streams) => {
  streams.stdout.write('\x1bc'); // Full terminal reset sequence
  // Alternatively \x1b[2J\x1b[H if \x1bc doesn't work perfectly in xterm
  return 0;
};

export const exit: CommandHandler = async (args, env, streams) => {
  const exitCode = args.length > 0 ? parseInt(args[0], 10) || 0 : 0;
  
  if (env.userStack && env.userStack.length > 0) {
    env.popUser();
    return exitCode;
  }
  
  if (env.windowId) {
    const { useWindowStore } = await import('../../../store/useUbuntuWindowStore');
    useWindowStore.getState().closeWindow(env.windowId);
  } else {
    streams.stdout.writeLine('logout');
  }
  
  return exitCode;
};

export const help: CommandHandler = (_args, _env, streams) => {
  const output = [
    'Ubuntu Web Terminal — Available commands:',
    '',
    '  Navigation:',
    '    pwd                   Print name of current/working directory',
    '    cd [dir]              Change the working directory',
    '    ls [-la] [dir]        List directory contents',
    '',
    '  File Operations:',
    '    cat <file>            Display file content',
    '    touch <file>          Create empty file or update timestamp',
    '    mkdir <dir>           Create a directory',
    '    rm [-rf] <file...>    Remove files or directories',
    '    cp [-r] <src> <dest>  Copy files or directories',
    '    mv <src> <dest>       Move/rename files or directories',
    '    rmdir <dir>           Remove empty directories',
    '    find [path] [-name <pattern>] [-type f|d]',
    '                          Search for files in directory hierarchy',
    '    chmod <mode> <file>   Change file permissions',
    '    chown <owner> <file>  Change file owner',
    '    ln [-s] <target> <link> Create hard or symbolic links',
    '',
    '  Text Processing:',
    '    grep [-inrc] <pattern> <file...>',
    '                          Search for patterns in files',
    '    head [-n N] <file>    Display first N lines (default 10)',
    '    tail [-n N] <file>    Display last N lines (default 10)',
    '    wc [-lwc] <file...>   Print line, word, and byte counts',
    '',
    '  System Information:',
    '    whoami                Print effective username',
    '    uname [-asnr]         Print system information',
    '    date                  Print current date and time',
    '    uptime                Show system uptime',
    '    free [-h]             Display memory usage',
    '    top                   Display process snapshot',
    '    hostname              Show system hostname',
    '',
    '  Shell:',
    '    echo <text>           Display a line of text',
    '    clear                 Clear the terminal screen',
    '    history [-c]          Display or clear command history',
    '    help                  Display this help and exit',
    '',
    '  User Management:',
    '    id [user]             Display user and group IDs',
    '    groups [user]         Display group memberships',
    '    passwd [user]         Change user password',
    '    adduser <user>        Add a new user (requires root)',
    '    su [user]             Switch user (default: root)',
    '    sudo [flags] command  Execute command as another user',
    '',
    '  System Power:',
    '    poweroff              Power off the system (requires root)',
    '    reboot                Reboot the system (requires root)',
    '',
    '  Editors:',
    '    nano <file>           Edit a file (^O save, ^X exit)',
    '    vi <file>             Alias for nano',
    '',
    '  Filesystems:',
    '    mount                 List active mount points',
  ];
  output.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const hostname: CommandHandler = async (_args, _env, streams) => {
  try {
    const { readFile } = await import('../../../fs/operations');
    const blob = await readFile('/etc/hostname');
    const text = await blob.text();
    [text.trim()].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  } catch (err) {
    const fallback = localStorage.getItem('ubuntu-hostname') || 'envyy';
    [fallback].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }
};

export const poweroff: CommandHandler = (_args, env, streams) => {
  const username = env?.effectiveUser || getAuthContext().username;
  if (username !== 'root') {
    ['poweroff: Permission denied.', 'poweroff must be run as root. Try: sudo poweroff'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }
  
  setTimeout(() => {
    useHardwareStore.getState().powerOff();
  }, 100);
  
  ['System is going down for poweroff NOW!'].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};


export const mount: CommandHandler = (_args, _env, streams) => {
  const output = [
    '/dev/vda1 on / type ext4 (rw,relatime)',
    'proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)',
    'devtmpfs on /dev type devtmpfs (rw,nosuid,size=8192k,nr_inodes=2048,mode=755)',
    'tmpfs on /tmp type tmpfs (rw,nosuid,nodev)'
  ];
  output.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const reboot: CommandHandler = (_args, env, streams) => {
  const username = env?.effectiveUser || getAuthContext().username;
  if (username !== 'root') {
    ['reboot: Permission denied.', 'reboot must be run as root. Try: sudo reboot'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }
  
  setTimeout(() => {
    useHardwareStore.getState().powerOff();
    setTimeout(() => useHardwareStore.getState().turnOn(), 500);
  }, 100);
  
  ['System is going down for reboot NOW!'].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};


export const envCmd: CommandHandler = (_args, env, streams) => {
  for (const [key, value] of Object.entries(env.envVars)) {
    streams.stdout.writeLine(`${key}=${value}`);
  }
  return 0;
};

export const exportCmd: CommandHandler = (args, env, streams) => {
  if (args.length === 0) {
    for (const [key, value] of Object.entries(env.envVars)) {
      streams.stdout.writeLine(`declare -x ${key}="${value}"`);
    }
    return 0;
  }
  
  for (const arg of args) {
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const key = arg.slice(0, eqIdx);
      const val = arg.slice(eqIdx + 1);
      env.updateEnv(key, val);
    }
  }
  
  return 0;
};

export const unsetCmd: CommandHandler = (args, env, _streams) => {
  for (const arg of args) {
    delete env.envVars[arg];
  }
  return 0;
};

export const whichCmd: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) return 1;
  
  const { commandRegistry } = await import('./index');
  let exitCode = 0;
  
  for (const arg of args) {
    if (env.aliases[arg]) {
      streams.stdout.writeLine(`alias ${arg}='${env.aliases[arg]}'`);
    } else if (commandRegistry[arg]) {
      streams.stdout.writeLine(`/usr/bin/${arg}`);
    } else {
      exitCode = 1;
    }
  }
  
  return exitCode;
};

export const typeCmd: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) return 1;
  
  const { commandRegistry } = await import('./index');
  let exitCode = 0;
  
  for (const arg of args) {
    if (env.aliases[arg]) {
      streams.stdout.writeLine(`${arg} is aliased to \`${env.aliases[arg]}'\``);
    } else if (['cd', 'pwd', 'history', 'help', 'exit', 'export', 'unset', 'alias', 'unalias', 'type'].includes(arg)) {
      streams.stdout.writeLine(`${arg} is a shell builtin`);
    } else if (commandRegistry[arg]) {
      streams.stdout.writeLine(`${arg} is /usr/bin/${arg}`);
    } else {
      streams.stderr.writeLine(`bash: type: ${arg}: not found`);
      exitCode = 1;
    }
  }
  
  return exitCode;
};

export const aliasCmd: CommandHandler = (args, env, streams) => {
  if (args.length === 0) {
    for (const [key, value] of Object.entries(env.aliases).sort()) {
      streams.stdout.writeLine(`alias ${key}='${value}'`);
    }
    return 0;
  }
  
  let exitCode = 0;
  for (const arg of args) {
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const key = arg.slice(0, eqIdx);
      const val = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
      env.setAlias(key, val);
    } else {
      if (env.aliases[arg]) {
        streams.stdout.writeLine(`alias ${arg}='${env.aliases[arg]}'`);
      } else {
        streams.stderr.writeLine(`bash: alias: ${arg}: not found`);
        exitCode = 1;
      }
    }
  }
  
  return exitCode;
};

export const unaliasCmd: CommandHandler = (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine(`unalias: usage: unalias [-a] name [name ...]`);
    return 1;
  }
  
  if (args[0] === '-a') {
    env.aliases = {};
    return 0;
  }
  
  let exitCode = 0;
  for (const arg of args) {
    if (env.aliases[arg]) {
      env.removeAlias(arg);
    } else {
      streams.stderr.writeLine(`bash: unalias: ${arg}: not found`);
      exitCode = 1;
    }
  }
  
  return exitCode;
};

export const sleepCmd: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine(`sleep: missing operand`);
    return 1;
  }
  
  const seconds = parseFloat(args[0]);
  if (isNaN(seconds) || seconds < 0) {
    streams.stderr.writeLine(`sleep: invalid time interval '${args[0]}'`);
    return 1;
  }
  
  return new Promise<number>((resolve) => {
    let elapsed = 0;
    const intervalMs = 100;
    const totalMs = seconds * 1000;
    
    const interval = setInterval(() => {
      elapsed += intervalMs;
      if (env.abortSignal?.aborted) {
        clearInterval(interval);
        resolve(130); // 128 + 2 (SIGINT)
        return;
      }
      if (elapsed >= totalMs) {
        clearInterval(interval);
        resolve(0);
      }
    }, intervalMs);
  });
};

export const trueCmd: CommandHandler = () => 0;

export const falseCmd: CommandHandler = () => 1;

export const yesCmd: CommandHandler = async (args, env, streams) => {
  const str = args.length > 0 ? args.join(' ') : 'y';
  
  return new Promise<number>((resolve) => {
    let count = 0;
    const interval = setInterval(() => {
      if (env.abortSignal?.aborted) {
        clearInterval(interval);
        resolve(130);
        return;
      }
      
      for (let i = 0; i < 50; i++) {
        streams.stdout.writeLine(str);
      }
      count += 50;
      
      // Safety limit just in case
      if (count > 100000) {
        clearInterval(interval);
        resolve(0);
      }
    }, 50); // Yield to event loop
  });
};

export const seqCmd: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine(`seq: missing operand`);
    return 1;
  }
  
  let start = 1;
  let increment = 1;
  let end = 1;
  
  if (args.length === 1) {
    end = parseFloat(args[0]);
  } else if (args.length === 2) {
    start = parseFloat(args[0]);
    end = parseFloat(args[1]);
  } else {
    start = parseFloat(args[0]);
    increment = parseFloat(args[1]);
    end = parseFloat(args[2]);
  }
  
  if (isNaN(start) || isNaN(increment) || isNaN(end)) {
    streams.stderr.writeLine(`seq: invalid floating point argument`);
    return 1;
  }
  
  if (increment === 0) return 1;
  
  let i = start;
  while ((increment > 0 && i <= end) || (increment < 0 && i >= end)) {
    // Avoid infinite loop if somehow floating point is weird
    if (Math.abs(i) > 1000000) break;
    streams.stdout.writeLine(i.toString());
    i += increment;
  }
  
  return 0;
};

export const printfCmd: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine(`printf: usage: printf format [arguments]`);
    return 1;
  }
  
  const format = args[0]
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
    
  let argIdx = 1;
  let result = '';
  
  for (let i = 0; i < format.length; i++) {
    if (format[i] === '%' && i + 1 < format.length) {
      const type = format[i + 1];
      const val = args[argIdx] !== undefined ? args[argIdx] : '';
      
      if (type === 's') {
        result += val;
      } else if (type === 'd') {
        result += parseInt(val || '0', 10);
      } else if (type === 'f') {
        result += parseFloat(val || '0').toFixed(6);
      } else if (type === '%') {
        result += '%';
        argIdx--; // Did not consume arg
      } else {
        result += '%' + type;
        argIdx--;
      }
      i++;
      argIdx++;
    } else {
      result += format[i];
    }
  }
  
  // Write line handles newline, but printf shouldn't add a trailing newline automatically unless \n is provided.
  // Wait, streams.stdout.writeLine adds \n.
  // We can write it via writeLine but strip the last \n if present, or just let writeLine handle it.
  // A true terminal stream has `write` vs `writeLine`. We only have `writeLine` which adds `\r\n`.
  // To avoid adding extra newlines, we should split by \n and writeLine.
  const parts = result.split('\n');
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1 && parts[i] === '') break;
    streams.stdout.writeLine(parts[i]);
  }
  
  return 0;
};

export const man: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('What manual page do you want?');
    return 1;
  }
  
  const cmd = args[0];
  const pages: Record<string, string[]> = {
    ls: [
      'LS(1)                            User Commands                           LS(1)',
      '',
      'NAME',
      '       ls - list directory contents',
      '',
      'SYNOPSIS',
      '       ls [OPTION]... [FILE]...',
      '',
      'DESCRIPTION',
      '       List information about the FILEs (the current directory by default).',
      '       Sort entries alphabetically if none of -cftuvSUX nor --sort is speci‐',
      '       fied.'
    ],
    cat: [
      'CAT(1)                           User Commands                          CAT(1)',
      '',
      'NAME',
      '       cat - concatenate files and print on the standard output',
      '',
      'SYNOPSIS',
      '       cat [OPTION]... [FILE]...',
      '',
      'DESCRIPTION',
      '       Concatenate FILE(s) to standard output.'
    ]
  };
  
  if (pages[cmd]) {
    pages[cmd].forEach(l => streams.stdout.writeLine(l));
    return 0;
  }
  
  streams.stderr.writeLine(`No manual entry for ${cmd}`);
  return 1;
};

export const cal: CommandHandler = (_args, _env, streams) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const today = now.getDate();
  
  const header = `    ${monthNames[month]} ${year}`;
  streams.stdout.writeLine(header);
  streams.stdout.writeLine('Su Mo Tu We Th Fr Sa');
  
  let line = '';
  for (let i = 0; i < firstDay; i++) {
    line += '   ';
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = d.toString().padStart(2, ' ');
    if (d === today) {
      // Highlight today (invert)
      line += `\x1b[7m${dStr}\x1b[0m `;
    } else {
      line += `${dStr} `;
    }
    
    if ((firstDay + d) % 7 === 0) {
      streams.stdout.writeLine(line.slice(0, -1));
      line = '';
    }
  }
  
  if (line.length > 0) {
    streams.stdout.writeLine(line.trimEnd());
  }
  
  return 0;
};

export const bc: CommandHandler = (args, _env, streams) => {
  // We'll evaluate an expression passed via stdin or args, or start a simple interactive REPL
  // (Interactive REPL is hard in this mock environment, so we'll just handle stdin)
  const input = streams.stdin.readAll().trim() || args.join(' ');
  
  if (!input) {
    streams.stdout.writeLine('bc 1.07.1');
    streams.stdout.writeLine('Copyright 1991-1994, 1997, 1998, 2000, 2004, 2006, 2008, 2012-2017 Free Software Foundation, Inc.');
    // Real bc would wait for stdin lines here. We just exit.
    return 0;
  }
  
  try {
    // A very rudimentary and unsafe eval-based parser. We'll strip anything not math related.
    const safeInput = input.replace(/[^0-9+\-*/%(). ]/g, '');
    if (safeInput !== input) {
      throw new Error('Invalid syntax');
    }
    const result = new Function(`return ${safeInput}`)();
    streams.stdout.writeLine(result.toString());
  } catch {
    streams.stderr.writeLine('Runtime error (func=(main), adr=3): syntax error');
    return 1;
  }
  
  return 0;
};

export const diff: CommandHandler = async (args, env, streams) => {
  if (args.length < 2) {
    streams.stderr.writeLine('diff: missing operand after');
    return 1;
  }
  
  const file1 = args[0];
  const file2 = args[1];
  
  try {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    const node1 = await resolveRelativePathAsync(cwdPath, file1);
    const node2 = await resolveRelativePathAsync(cwdPath, file2);
    
    if (!node1) { streams.stderr.writeLine(`diff: ${file1}: No such file or directory`); return 1; }
    if (!node2) { streams.stderr.writeLine(`diff: ${file2}: No such file or directory`); return 1; }
    
    const absPath1 = await getAbsolutePathAsync(node1.id);
    const absPath2 = await getAbsolutePathAsync(node2.id);
    
    const text1 = await (await readFile(absPath1)).text();
    const text2 = await (await readFile(absPath2)).text();
    
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    // Very naive diff
    let hasDiff = false;
    for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
      if (lines1[i] !== lines2[i]) {
        hasDiff = true;
        if (lines1[i] !== undefined) streams.stdout.writeLine(`\x1b[31m- ${lines1[i]}\x1b[0m`);
        if (lines2[i] !== undefined) streams.stdout.writeLine(`\x1b[32m+ ${lines2[i]}\x1b[0m`);
      } else {
        streams.stdout.writeLine(`  ${lines1[i]}`);
      }
    }
    
    return hasDiff ? 1 : 0;
  } catch (e: any) {
    streams.stderr.writeLine(`diff: ${e.message}`);
    return 2;
  }
};

export const md5sum: CommandHandler = async (args, env, streams) => {
  return hashsum(args, env, streams, 'MD5');
};

export const sha256sum: CommandHandler = async (args, env, streams) => {
  return hashsum(args, env, streams, 'SHA-256');
};

const hashsum = async (args: string[], env: any, streams: any, algo: string) => {
  if (args.length === 0) {
    streams.stderr.writeLine(`${algo.toLowerCase()}sum: missing operand`);
    return 1;
  }
  
  let exitCode = 0;
  
  for (const target of args) {
    try {
      const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
      const { readFile } = await import('../../../fs/operations');
      const cwdPath = await getAbsolutePathAsync(env.cwdId);
      
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (!node) {
        streams.stderr.writeLine(`${algo.toLowerCase()}sum: ${target}: No such file or directory`);
        exitCode = 1;
        continue;
      }
      
      if (node.type === 'directory') {
        streams.stderr.writeLine(`${algo.toLowerCase()}sum: ${target}: Is a directory`);
        exitCode = 1;
        continue;
      }
      
      const absPath = await getAbsolutePathAsync(node.id);
      const blob = await readFile(absPath);
      const buffer = await blob.arrayBuffer();
      
      let digest: ArrayBuffer;
      if (algo === 'MD5') {
        // Web crypto doesn't support MD5, we'll fake it deterministically based on length and first bytes
        const fakeHash = Array.from(new Uint8Array(buffer).slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('');
        digest = new TextEncoder().encode(fakeHash.padEnd(32, '0').slice(0, 32)).buffer;
      } else {
        digest = await crypto.subtle.digest(algo, buffer);
      }
      
      const hashArray = Array.from(new Uint8Array(digest));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      streams.stdout.writeLine(`${hashHex}  ${target}`);
    } catch (e: any) {
      streams.stderr.writeLine(`${algo.toLowerCase()}sum: ${target}: ${e.message}`);
      exitCode = 1;
    }
  }
  
  return exitCode;
};

export const xxd: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('xxd: missing operand');
    return 1;
  }
  
  try {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    const node = await resolveRelativePathAsync(cwdPath, args[0]);
    if (!node) {
      streams.stderr.writeLine(`xxd: ${args[0]}: No such file or directory`);
      return 1;
    }
    
    if (node.type === 'directory') {
      streams.stderr.writeLine(`xxd: ${args[0]}: Is a directory`);
      return 1;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < bytes.length; i += 16) {
      const offset = i.toString(16).padStart(8, '0');
      let hexPart = '';
      let asciiPart = '';
      
      for (let j = 0; j < 16; j++) {
        if (i + j < bytes.length) {
          const b = bytes[i + j];
          hexPart += b.toString(16).padStart(2, '0');
          if (j % 2 !== 0) hexPart += ' ';
          
          if (b >= 32 && b <= 126) asciiPart += String.fromCharCode(b);
          else asciiPart += '.';
        } else {
          hexPart += '  ';
          if (j % 2 !== 0) hexPart += ' ';
        }
      }
      
      streams.stdout.writeLine(`${offset}: ${hexPart} ${asciiPart}`);
    }
    
    return 0;
  } catch (e: any) {
    streams.stderr.writeLine(`xxd: ${e.message}`);
    return 1;
  }
};
