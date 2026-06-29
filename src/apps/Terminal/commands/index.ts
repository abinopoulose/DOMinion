import type { CommandHandler } from './types';
import * as navigation from './navigation';
import * as fileOps from './fileOps';
import * as misc from './misc';

export const commandRegistry: Record<string, CommandHandler> = {
  pwd: navigation.pwd,
  cd: navigation.cd,
  ls: navigation.ls,
  
  cat: fileOps.cat,
  touch: fileOps.touch,
  mkdir: fileOps.mkdir,
  rm: fileOps.rm,
  
  echo: misc.echo,
  clear: misc.clear,
  help: misc.help,
  whoami: misc.whoami,
  hostname: misc.hostname,
  date: misc.date,
};
