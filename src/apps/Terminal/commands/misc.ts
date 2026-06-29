import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { ROOT_ID } from '../../../core/vfs/seed';

export const echo: CommandHandler = (args) => {
  return { output: [args.join(' ')] };
};

export const clear: CommandHandler = (args, cwdId, updateCwd, clearHistory) => {
  clearHistory();
  return { output: [] };
};

export const help: CommandHandler = () => {
  return {
    output: [
      'Ubuntu Web Terminal - Available commands:',
      '  pwd            Print name of current/working directory',
      '  cd [dir]       Change the working directory',
      '  ls [dir]       List directory contents',
      '  cat [file]     Concatenate files and print on the standard output',
      '  touch [file]   Change file timestamps (creates empty file)',
      '  mkdir [dir]    Make directories',
      '  rm [file/dir]  Remove files or directories (use -r for dirs)',
      '  echo [text]    Display a line of text',
      '  clear          Clear the terminal screen',
      '  whoami         Print effective userid',
      '  hostname       Show or set the system\'s host name',
      '  date           Print or set the system date and time',
      '  help           Display this help and exit'
    ]
  };
};

export const whoami: CommandHandler = () => {
  return { output: ['user'] };
};

export const hostname: CommandHandler = () => {
  const store = useVFSStore.getState();
  const node = store.resolvePath('/etc/hostname');
  if (node && node.type === 'file') {
    return { output: [node.content.trim()] };
  }
  return { output: ['ubuntu-web'] };
};

export const date: CommandHandler = () => {
  return { output: [new Date().toString()] };
};
