import { useState } from 'react';
import wallpaper from '../../assets/wallpapers/ubuntu-24-wallpaper.png';
import homeIcon from '../../assets/icons/home.svg';
import trashIcon from '../../assets/icons/trash.svg';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import './Desktop.css';

interface DesktopIconItem {
  id: string;
  label: string;
  icon: string;
}

const DESKTOP_ICONS: DesktopIconItem[] = [
  { id: 'home', label: 'Home', icon: homeIcon },
  { id: 'trash', label: 'Trash', icon: trashIcon },
];

const CONTEXT_MENU_ITEMS = [
  { id: 'new-folder', label: 'New Folder' },
  { id: 'new-file', label: 'New File' },
  { id: 'change-wallpaper', label: 'Change Wallpaper' },
  { id: 'sep-1', label: '', separator: true },
  { id: 'open-terminal', label: 'Open Terminal' },
];

interface DesktopProps {
  onUnfocusAll: () => void;
}

export function Desktop({ onUnfocusAll }: DesktopProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();

  const handleIconClick = (id: string) => {
    setSelectedIcon(id);
  };

  const handleDesktopClick = () => {
    setSelectedIcon(null);
    onUnfocusAll();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    showContextMenu(e);
  };

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${wallpaper})` }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      <div className="desktop__icons">
        {DESKTOP_ICONS.map((item) => (
          <div
            key={item.id}
            className={`desktop-icon${selectedIcon === item.id ? ' desktop-icon--selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(item.id);
            }}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <img className="desktop-icon__img" src={item.icon} alt={item.label} draggable={false} />
            <span className="desktop-icon__label">{item.label}</span>
          </div>
        ))}
      </div>

      {menu.isVisible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={CONTEXT_MENU_ITEMS.map((item) => ({
            ...item,
            onClick: () => hideContextMenu(),
          }))}
        />
      )}
    </div>
  );
}
