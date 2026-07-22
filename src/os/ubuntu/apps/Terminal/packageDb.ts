import type { CommandHandler } from './commands/types';

export interface MockPackage {
  name: string;
  version: string;
  description: string;
  installedSize: string;
  depends?: string[];
  section: string;
  commandHandler?: CommandHandler;
}

export const PACKAGE_DB: MockPackage[] = [
  {
    name: 'neofetch',
    version: '7.1.0-4',
    description: 'Shows Linux System Information with Distribution Logo\n A command-line system information tool written in bash 3.2+.',
    installedSize: '152 kB',
    depends: ['bash (>= 3.0)'],
    section: 'universe/utils'
  },
  {
    name: 'tree',
    version: '2.1.1-1',
    description: 'Displays an indented directory tree, in color',
    installedSize: '124 kB',
    section: 'universe/utils'
  },
  {
    name: 'cowsay',
    version: '3.03+dfsg2-8',
    description: 'Configurable speaking/thinking cow',
    installedSize: '65 kB',
    section: 'universe/games'
  },
  {
    name: 'figlet',
    version: '2.2.5-3',
    description: 'Make large character ASCII banners out of ordinary text',
    installedSize: '89 kB',
    section: 'universe/text'
  },
  {
    name: 'sl',
    version: '5.02-1',
    description: 'Correct you if you type `sl\' by mistake',
    installedSize: '24 kB',
    section: 'universe/games'
  },
  {
    name: 'fortune',
    version: '1.99.1-7',
    description: 'Provides fortune cookies on demand',
    installedSize: '1.5 MB',
    section: 'universe/games'
  },
  {
    name: 'htop',
    version: '3.3.0-4',
    description: 'Interactive processes viewer',
    installedSize: '333 kB',
    section: 'utils'
  },
  {
    name: 'git',
    version: '2.43.0-1ubuntu7.1',
    description: 'fast, scalable, distributed revision control system',
    installedSize: '23.8 MB',
    section: 'vcs'
  },
  {
    name: 'vim',
    version: '2:9.1.0016-1ubuntu7.1',
    description: 'Vi IMproved - enhanced vi editor',
    installedSize: '3,874 kB',
    section: 'editors'
  },
  {
    name: 'nano',
    version: '7.2-2build1',
    description: 'small, friendly text editor inspired by Pico',
    installedSize: '886 kB',
    section: 'editors'
  },
  {
    name: 'curl',
    version: '8.5.0-2ubuntu10.1',
    description: 'command line tool for transferring data with URL syntax',
    installedSize: '463 kB',
    section: 'web'
  },
  {
    name: 'wget',
    version: '1.21.4-1ubuntu4.1',
    description: 'retrieves files from the web',
    installedSize: '1,012 kB',
    section: 'web'
  },
  {
    name: 'build-essential',
    version: '12.10ubuntu1',
    description: 'Informational list of build-essential packages',
    installedSize: '20 kB',
    section: 'devel'
  },
  {
    name: 'python3',
    version: '3.12.3-0ubuntu1',
    description: 'interactive high-level object-oriented language (default python3 version)',
    installedSize: '65 kB',
    section: 'python'
  },
  {
    name: 'nodejs',
    version: '18.19.1+dfsg-6ubuntu5',
    description: 'evented I/O for V8 javascript - runtime executable',
    installedSize: '15.2 MB',
    section: 'web'
  }
];

// Provide initial installed base
const BASE_SYSTEM_PACKAGES = ['bash', 'coreutils', 'nano', 'curl', 'wget', 'git', 'vim'];

export function getInstalledPackages(): string[] {
  try {
    const data = localStorage.getItem('dominion-installed-packages');
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  return [...BASE_SYSTEM_PACKAGES];
}

export function isPackageInstalled(name: string): boolean {
  return getInstalledPackages().includes(name);
}

export function installPackage(name: string): void {
  const pkgs = new Set(getInstalledPackages());
  pkgs.add(name);
  localStorage.setItem('dominion-installed-packages', JSON.stringify(Array.from(pkgs)));
}

export function removePackage(name: string): void {
  const pkgs = new Set(getInstalledPackages());
  pkgs.delete(name);
  localStorage.setItem('dominion-installed-packages', JSON.stringify(Array.from(pkgs)));
}
