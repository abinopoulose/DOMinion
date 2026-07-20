import type { CommandHandler } from './types';
import * as navigation from './navigation';
import * as fileOps from './fileOps';
import * as textOps from './textOps';
import * as sysInfo from './sysInfo';
import * as shellOps from './shellOps';
import * as misc from './misc';
import * as userMgmt from './userMgmt';
import * as networking from './networking';
import * as archiveOps from './archiveOps';
import * as processOps from './processOps';
import * as testCmd from './testCmd';
import { su } from './su';
import { sudo } from './sudo';

import { apt, dpkg } from './apt';
import { getInstalledPackages } from '../packageDb';
import { neofetch } from './installable/neofetch';
import { tree } from './installable/tree';
import { cowsay } from './installable/cowsay';
import { figlet } from './installable/figlet';
import { sl } from './installable/sl';
import { fortune } from './installable/fortune';
import { htop } from './installable/htop';

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
  ln: fileOps.ln,
  find: fileOps.find,
  chmod: fileOps.chmod,
  chown: fileOps.chown,
  du: fileOps.du,
  file: fileOps.file,
  stat: fileOps.statCmd,
  readlink: fileOps.readlink,
  basename: fileOps.basename,
  dirname: fileOps.dirname,
  realpath: fileOps.realpath,

  // Text processing
  grep: textOps.grep,
  head: textOps.head,
  tail: textOps.tail,
  wc: textOps.wc,
  sort: textOps.sort,
  uniq: textOps.uniq,
  cut: textOps.cut,
  tr: textOps.tr,
  tee: textOps.tee,
  sed: textOps.sed,
  awk: textOps.awk,

  // System information
  whoami: sysInfo.whoami,     
  uname: sysInfo.uname,
  date: sysInfo.date,         
  uptime: sysInfo.uptime,
  free: sysInfo.free,
  top: sysInfo.top,
  df: sysInfo.df,
  lsblk: sysInfo.lsblk,
  lscpu: sysInfo.lscpu,
  lsusb: sysInfo.lsusb,
  dmesg: sysInfo.dmesg,
  systemctl: sysInfo.systemctl,

  // Networking
  ping: networking.ping,
  curl: networking.curl,
  wget: networking.wget,
  ifconfig: networking.ifconfig,
  ip: networking.ip,
  ss: networking.ss,
  netstat: networking.netstat,
  nslookup: networking.nslookup,
  dig: networking.dig,
  ssh: networking.ssh,

  // Archive Operations
  tar: archiveOps.tar,
  zip: archiveOps.zip,
  unzip: archiveOps.unzip,
  gzip: archiveOps.gzip,
  gunzip: archiveOps.gunzip,

  // Process Operations
  ps: processOps.ps,
  kill: processOps.kill,
  jobs: processOps.jobs,
  fg: processOps.fg,
  bg: processOps.bg,
  nohup: processOps.nohup,
  xargs: processOps.xargs,

  // Shell operations
  history: shellOps.history,
  bash: shellOps.bash,
  source: shellOps.source,
  '.': shellOps.source,
  read: shellOps.read,
  test: testCmd.testCmd,
  '[': testCmd.testCmd,

  // Miscellaneous
  echo: misc.echo,
  clear: misc.clear,
  reset: misc.reset,
  help: misc.help,
  hostname: misc.hostname,
  mount: misc.mount,
  poweroff: misc.poweroff,
  reboot: misc.reboot,
  env: misc.envCmd,
  export: misc.exportCmd,
  unset: misc.unsetCmd,
  which: misc.whichCmd,
  type: misc.typeCmd,
  alias: misc.aliasCmd,
  unalias: misc.unaliasCmd,
  sleep: misc.sleepCmd,
  true: misc.trueCmd,
  false: misc.falseCmd,
  yes: misc.yesCmd,
  seq: misc.seqCmd,
  printf: misc.printfCmd,
  man: misc.man,
  cal: misc.cal,
  bc: misc.bc,
  diff: misc.diff,
  md5sum: misc.md5sum,
  sha256sum: misc.sha256sum,
  xxd: misc.xxd,
  exit: misc.exit,

  // User management
  id: userMgmt.id,
  groups: userMgmt.groups,
  passwd: userMgmt.passwd,
  adduser: userMgmt.adduser,
  useradd: userMgmt.adduser,  // alias

  // Switch user
  su,
  sudo,
  
  // Package Management
  apt,
  'apt-get': apt,
  'apt-cache': apt,
  dpkg
};

const dynamicCommandHandlers: Record<string, CommandHandler> = {
  neofetch,
  tree,
  cowsay,
  figlet,
  sl,
  fortune,
  htop
};

export const loadDynamicCommands = () => {
  const installed = getInstalledPackages();
  
  Object.keys(dynamicCommandHandlers).forEach(cmd => {
    delete commandRegistry[cmd];
  });
  
  installed.forEach(cmd => {
    if (dynamicCommandHandlers[cmd]) {
      commandRegistry[cmd] = dynamicCommandHandlers[cmd];
    }
  });
};

// Load dynamic commands on initialization
loadDynamicCommands();
