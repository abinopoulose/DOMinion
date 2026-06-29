import { DockIcon } from './DockIcon';
import terminalIcon from '../../assets/icons/terminal.svg';
import fileManagerIcon from '../../assets/icons/file-manager.svg';
import browserIcon from '../../assets/icons/browser.svg';
import './Dock.css';

interface DockApp {
  id: string;
  label: string;
  icon: string;
}

const DOCK_APPS: DockApp[] = [
  { id: 'file-manager', label: 'Files', icon: fileManagerIcon },
  { id: 'terminal', label: 'Terminal', icon: terminalIcon },
  { id: 'browser', label: 'Browser', icon: browserIcon },
];

interface DockProps {
  onAppClick: (appId: string) => void;
  activeAppIds: Set<string>;
}

export function Dock({ onAppClick, activeAppIds }: DockProps) {
  return (
    <nav className="dock" id="dock">
      {DOCK_APPS.map((app) => (
        <DockIcon
          key={app.id}
          id={app.id}
          label={app.label}
          icon={app.icon}
          isActive={activeAppIds.has(app.id)}
          onClick={() => onAppClick(app.id)}
        />
      ))}
    </nav>
  );
}
