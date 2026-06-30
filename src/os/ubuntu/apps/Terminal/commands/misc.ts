import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';


export const echo: CommandHandler = (args) => {
  return { output: [args.join(' ')] };
};

export const clear: CommandHandler = (_args, _cwdId, _updateCwd, clearHistory) => {
  clearHistory();
  return { output: [] };
};

export const help: CommandHandler = () => {
  return {
    output: [
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
      '  Editors:',
      '    nano <file>           Edit a file (^O save, ^X exit)',
      '    vi <file>             Alias for nano',
    ]
  };
};

export const hostname: CommandHandler = () => {
  const store = useVFSStore.getState();
  const node = store.resolvePath('/etc/hostname');
  if (node && node.type === 'file') {
    return { output: [node.content.trim()] };
  }
  return { output: ['ubuntu-web'] };
};

