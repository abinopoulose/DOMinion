import type { CommandHandler } from '../types';

export const neofetch: CommandHandler = (args, env, streams) => {
  const uptimeMins = Math.floor((Date.now() - ((window as any).APP_BOOT_TIME || Date.now())) / 60000);
  const hours = Math.floor(uptimeMins / 60);
  const mins = uptimeMins % 60;
  const uptimeStr = hours > 0 ? `${hours} hours, ${mins} mins` : `${mins} mins`;
  
  const pkgs = (() => {
    try {
      const data = localStorage.getItem('dominion-installed-packages');
      if (data) {
        return JSON.parse(data).length;
      }
    } catch {}
    return 7;
  })();

  const output = [
    `            \x1b[31m.-/+oossssoo+/-.\x1b[0m               \x1b[32m${env.effectiveUser}\x1b[0m@\x1b[32menvyy\x1b[0m`,
    `        \x1b[31m\`:+ssssssssssssssssss+:\`\x1b[0m           ---------`,
    `      \x1b[31m-+ssssssssssssssssssyyssss+-\x1b[0m         \x1b[33mOS\x1b[0m: Ubuntu 24.04.1 LTS x86_64`,
    `    \x1b[31m.ossssssssssssssssssdMMMNysssso.\x1b[0m       \x1b[33mHost\x1b[0m: DOMinion Virtual Machine`,
    `   \x1b[31m/ssssssssssshdmmNNmmyNMMMMhssssss/\x1b[0m      \x1b[33mKernel\x1b[0m: 6.8.0-31-generic`,
    `  \x1b[31m+ssssssssshmydMMMMMMMNddddyssssssss+\x1b[0m     \x1b[33mUptime\x1b[0m: ${uptimeStr}`,
    ` \x1b[31m/sssssssshNMMMyhhyyyyhmNMMMNhssssssss/\x1b[0m    \x1b[33mPackages\x1b[0m: ${pkgs} (dpkg)`,
    `\x1b[31m.ssssssssdMMMNhsssssssssshNMMMdssssssss.\x1b[0m   \x1b[33mShell\x1b[0m: bash 5.2.15`,
    `\x1b[31m+sssshhhyNMMNyssssssssssssyNMMMysssssss+\x1b[0m   \x1b[33mResolution\x1b[0m: ${window.innerWidth}x${window.innerHeight}`,
    `\x1b[31mossyNMMMNyMMhsssssssssssssshmmmhssssssso\x1b[0m   \x1b[33mDE\x1b[0m: GNOME 46.0`,
    `\x1b[31mossyNMMMNyMMhsssssssssssssshmmmhssssssso\x1b[0m   \x1b[33mTerminal\x1b[0m: gnome-terminal`,
    `\x1b[31m+sssshhhyNMMNyssssssssssssyNMMMysssssss+\x1b[0m   \x1b[33mCPU\x1b[0m: Virtual (8) @ 3.40GHz`,
    `\x1b[31m.ssssssssdMMMNhsssssssssshNMMMdssssssss.\x1b[0m   \x1b[33mMemory\x1b[0m: 4301MiB / 15876MiB`,
    ` \x1b[31m/sssssssshNMMMyhhyyyyhdNMMMNhssssssss/\x1b[0m`,
    `  \x1b[31m+sssssssssdmydMMMMMMMMddddyssssssss+\x1b[0m`,
    `   \x1b[31m/ssssssssssshdmNNNNmyNMMMMhssssss/\x1b[0m`,
    `    \x1b[31m.osssssssssssssssssssdMMMNysssso.\x1b[0m`,
    `      \x1b[31m-+sssssssssssssssssyyyssss+-\x1b[0m`,
    `        \x1b[31m\`:+ssssssssssssssssss+:\`\x1b[0m`,
    `            \x1b[31m.-/+oossssoo+/-.\x1b[0m`,
    ''
  ];

  output.forEach(line => streams.stdout.writeLine(line));
  return 0;
};
