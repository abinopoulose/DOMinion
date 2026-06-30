import type { CommandHandler } from './types';
import * as navigation from './navigation';
import * as fileOps from './fileOps';
import * as textOps from './textOps';
import * as sysInfo from './sysInfo';
import * as shellOps from './shellOps';
import * as misc from './misc';

export const commandRegistry: Record<string, CommandHandler> = {
  // Navigation
  pwd: navigation.pwd,
  cd: navigation.cd,
  ls: navigation.ls,

  // File operations
  cat: fileOps.cat,
  touch: fileOps.touch,
  mkdir: fileOps.mkdir,
  rm: fileOps.rm,
  cp: fileOps.cp,
  mv: fileOps.mv,
  rmdir: fileOps.rmdir,
  find: fileOps.find,
  chmod: fileOps.chmod,
  chown: fileOps.chown,

  // Text processing
  grep: textOps.grep,
  head: textOps.head,
  tail: textOps.tail,
  wc: textOps.wc,

  // System information
  whoami: sysInfo.whoami,     // migrated from misc.ts
  uname: sysInfo.uname,
  date: sysInfo.date,         // migrated from misc.ts
  uptime: sysInfo.uptime,
  free: sysInfo.free,
  top: sysInfo.top,

  // Shell operations
  history: shellOps.history,

  // Miscellaneous
  echo: misc.echo,
  clear: misc.clear,
  help: misc.help,
  hostname: misc.hostname,
  poweroff: misc.poweroff,
  reboot: misc.reboot,
};
