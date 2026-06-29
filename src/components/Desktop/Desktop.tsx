import { useState } from 'react';
import wallpaper from '../../assets/wallpapers/ubuntu-24-wallpaper.png';
import homeIcon from '../../assets/icons/home.svg';
import trashIcon from '../../assets/icons/trash.svg';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useWindowStore, useDesktopStore, useVFSStore } from '../../store';
import { DESKTOP_ID } from '../../core/vfs/seed';
import folderIcon from '../../assets/icons/file-manager.svg';
import fileIcon from '../../assets/icons/file.svg';
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
  const openWindow = useWindowStore((state) => state.openWindow);
  const { wallpaper: storeWallpaper, setWallpaper } = useDesktopStore();
  const vfsStore = useVFSStore();
  const desktopFiles = vfsStore.getChildren(DESKTOP_ID);

  // Fallback to default wallpaper if not set in store
  const activeWallpaper = storeWallpaper || wallpaper;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextNode, setContextNode] = useState<{ id: string; name: string; type: string } | null>(null);

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      useVFSStore.getState().renameNode(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleIconClick = (id: string) => {
    setSelectedIcon(id);
    setEditingId(null);
  };

  const handleDesktopClick = () => {
    setSelectedIcon(null);
    setEditingId(null);
    onUnfocusAll();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    setContextNode(null); // click on empty desktop
    showContextMenu(e);
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    setSelectedIcon(file.id);
    setContextNode(file);
    showContextMenu(e);
  };

  // Determine what menu items to show based on what was right-clicked
  const menuItems = contextNode ? [
    {
      id: 'open',
      label: 'Open',
      onClick: () => {
        if (contextNode.type === 'directory') openWindow('file-manager');
        else openWindow('terminal');
        hideContextMenu();
      }
    },
    {
      id: 'rename',
      label: 'Rename',
      onClick: () => {
        setEditingId(contextNode.id);
        setEditValue(contextNode.name);
        hideContextMenu();
      }
    },
    { id: 'sep-1', label: '', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      onClick: () => {
        useVFSStore.getState().deleteNode(contextNode.id);
        hideContextMenu();
      }
    }
  ] : CONTEXT_MENU_ITEMS;

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${activeWallpaper})` }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      <div className="desktop__icons">
        {/* Static Icons */}
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
        
        {/* VFS Icons */}
        {desktopFiles.map((file) => (
          <div
            key={file.id}
            className={`desktop-icon${selectedIcon === file.id ? ' desktop-icon--selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(file.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (file.type === 'directory') openWindow('file-manager');
              else openWindow('terminal');
            }}
            onContextMenu={(e) => handleFileContextMenu(e, file)}
          >
            <img 
              className="desktop-icon__img" 
              src={file.type === 'directory' ? folderIcon : fileIcon} 
              alt={file.name} 
              draggable={false} 
            />
            {editingId === file.id ? (
              <input
                className="desktop-icon__rename-input"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-accent)',
                  color: 'white',
                  textAlign: 'center',
                  fontSize: '13px',
                  borderRadius: '4px',
                  marginTop: '2px',
                }}
              />
            ) : (
              <span 
                className="desktop-icon__label"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(file.id);
                  setEditValue(file.name);
                }}
              >
                {file.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {menu.isVisible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems.map((item) => ({
            ...item,
            onClick: item.onClick ? item.onClick : () => {
              if (item.id === 'open-terminal') {
                openWindow('terminal');
              } else if (item.id === 'new-folder') {
                const store = useVFSStore.getState();
                let name = 'New Folder';
                let i = 1;
                while (store.exists(DESKTOP_ID, name)) name = `New Folder ${i++}`;
                store.createNode(DESKTOP_ID, name, 'directory');
              } else if (item.id === 'new-file') {
                const store = useVFSStore.getState();
                let name = 'Untitled';
                let i = 1;
                while (store.exists(DESKTOP_ID, name)) name = `Untitled ${i++}`;
                store.createNode(DESKTOP_ID, name, 'file');
              }
              hideContextMenu();
            },
          }))}
        />
      )}
    </div>
  );
}
