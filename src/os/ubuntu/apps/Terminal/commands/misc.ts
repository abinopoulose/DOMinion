import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { useHardwareStore } from '../../../../../hardware/store/useHardwareStore';


export const echo: CommandHandler = (args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  [args.join(' ')].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const clear: CommandHandler = (_args, _cwdId, _updateCwd, clearHistory, _appState, process) => {
  clearHistory();
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const help: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
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
  output.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const hostname: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const store = useVFSStore.getState();
  const node = store.resolvePath('/etc/hostname');
  if (node && node.type === 'file') {
    [node.content.trim()].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }
  const fallback = localStorage.getItem('ubuntu-hostname') || 'envyy';
  [fallback].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const poweroff: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const username = _appState?.effectiveUser || getAuthContext().username;
  if (username !== 'root') {
    ['poweroff: Permission denied.', 'poweroff must be run as root. Try: sudo poweroff'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  setTimeout(() => {
    useHardwareStore.getState().powerOff();
  }, 100);
  
  ['System is going down for poweroff NOW!'].forEach((line: string) => process.stdout.writeLine(line)); return {};
};


export const mount: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const output = [
    '/dev/vda1 on / type ext4 (rw,relatime)',
    'proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)',
    'devtmpfs on /dev type devtmpfs (rw,nosuid,size=8192k,nr_inodes=2048,mode=755)',
    'tmpfs on /tmp type tmpfs (rw,nosuid,nodev)'
  ];
  output.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const reboot: CommandHandler = (_args, _cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const username = _appState?.effectiveUser || getAuthContext().username;
  if (username !== 'root') {
    ['reboot: Permission denied.', 'reboot must be run as root. Try: sudo reboot'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  setTimeout(() => {
    useHardwareStore.getState().powerOff();
    setTimeout(() => useHardwareStore.getState().turnOn(), 500);
  }, 100);
  
  ['System is going down for reboot NOW!'].forEach((line: string) => process.stdout.writeLine(line)); return {};
};
