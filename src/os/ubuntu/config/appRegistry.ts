import type { AppId } from '../types/window';

export interface AppMetadata {
  id: AppId;
  title: string;
  icon: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  processCmd: string;
  baseUsage: { cpu: number; mem: number };
}

export const APP_REGISTRY: Record<string, AppMetadata> = {
  'terminal': {
    id: 'terminal',
    title: 'Terminal',
    icon: '/ubuntu/icons/terminal-app.png',
    defaultSize: { width: 800, height: 500 },
    processCmd: '/usr/bin/gnome-terminal --server',
    baseUsage: { cpu: 0.2, mem: 0.1 }
  },
  'browser': {
    id: 'browser',
    title: 'Browser',
    icon: '/ubuntu/icons/browser.svg',
    defaultSize: { width: 900, height: 700 },
    processCmd: '/usr/bin/firefox',
    baseUsage: { cpu: 5.0, mem: 2.5 }
  },
  'file-manager': {
    id: 'file-manager',
    title: 'Files',
    icon: '/ubuntu/icons/folder.png',
    defaultSize: { width: 850, height: 600 },
    processCmd: '/usr/bin/nautilus --gapplication-service',
    baseUsage: { cpu: 0.2, mem: 0.3 }
  },
  'settings': {
    id: 'settings',
    title: 'Settings',
    icon: '/ubuntu/icons/system-settings.png',
    defaultSize: { width: 800, height: 600 },
    processCmd: '/usr/bin/gnome-control-center',
    baseUsage: { cpu: 0.5, mem: 0.4 }
  },
  'text-editor': {
    id: 'text-editor',
    title: 'Text Editor',
    icon: '/ubuntu/icons/text-editor.png',
    defaultSize: { width: 700, height: 500 },
    processCmd: '/usr/bin/gedit --gapplication-service',
    baseUsage: { cpu: 0.1, mem: 0.2 }
  },
  'clock': {
    id: 'clock',
    title: 'Clocks',
    icon: '/ubuntu/icons/clock-app.png',
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 600, height: 400 },
    processCmd: '/usr/bin/gnome-clocks',
    baseUsage: { cpu: 0.1, mem: 0.2 }
  },
  'welcome': {
    id: 'welcome',
    title: 'Welcome to Ubuntu',
    icon: '/ubuntu/icons/ubuntu-logo.svg',
    defaultSize: { width: 600, height: 400 },
    processCmd: '/usr/bin/gnome-initial-setup',
    baseUsage: { cpu: 0.1, mem: 0.2 }
  },
  'calculator': {
    id: 'calculator',
    title: 'Calculator',
    icon: '/ubuntu/icons/calculator-app.png',
    defaultSize: { width: 350, height: 500 },
    minSize: { width: 300, height: 450 },
    processCmd: '/usr/bin/gnome-calculator',
    baseUsage: { cpu: 0.0, mem: 0.1 }
  },
  'system-monitor': {
    id: 'system-monitor',
    title: 'System Monitor',
    icon: '/ubuntu/icons/preferences-system-time.png',
    defaultSize: { width: 700, height: 500 },
    processCmd: '/usr/bin/gnome-system-monitor',
    baseUsage: { cpu: 0.8, mem: 0.5 }
  },
  'image-viewer': {
    id: 'image-viewer',
    title: 'Image Viewer',
    icon: '/ubuntu/icons/image-viewer.png',
    defaultSize: { width: 600, height: 400 },
    processCmd: '/usr/bin/eog',
    baseUsage: { cpu: 0.4, mem: 0.6 }
  },
  'video-player': {
    id: 'video-player',
    title: 'Video Player',
    icon: '/ubuntu/icons/video-x-generic.png',
    defaultSize: { width: 600, height: 400 },
    processCmd: '/usr/bin/totem',
    baseUsage: { cpu: 3.5, mem: 1.5 }
  },
  'document-viewer': {
    id: 'document-viewer',
    title: 'Document Viewer',
    icon: '/ubuntu/icons/document-viewer.png',
    defaultSize: { width: 600, height: 800 },
    processCmd: '/usr/bin/evince',
    baseUsage: { cpu: 0.5, mem: 0.7 }
  },
  'disk-usage-analyzer': {
    id: 'disk-usage-analyzer',
    title: 'Disk Usage Analyzer',
    icon: '/ubuntu/icons/disk.png',
    defaultSize: { width: 500, height: 400 },
    processCmd: '/usr/bin/baobab',
    baseUsage: { cpu: 2.5, mem: 0.8 }
  },
  'error-reporter': {
    id: 'error-reporter',
    title: 'System Error',
    icon: '/ubuntu/icons/root-terminal-app.png',
    defaultSize: { width: 500, height: 350 },
    processCmd: '/usr/bin/apport-gtk',
    baseUsage: { cpu: 0.1, mem: 0.2 }
  },
  'terminal-preferences': {
    id: 'terminal-preferences',
    title: 'Terminal Preferences',
    icon: '/ubuntu/icons/terminal-app.png',
    defaultSize: { width: 500, height: 400 },
    processCmd: '/usr/bin/gnome-terminal --preferences',
    baseUsage: { cpu: 0.1, mem: 0.1 }
  }
};
