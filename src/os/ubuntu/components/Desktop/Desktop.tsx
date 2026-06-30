import { useState, useMemo } from 'react';
const wallpaper = '/ubuntu_wallpaper.jpg';
import homeIcon from '../../assets/icons/home.svg';
import trashIcon from '../../assets/icons/trash.svg';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import { useWindowStore, useVFSStore } from '../../store';
import { DESKTOP_ID, HOME_ID, TRASH_ID } from '../../fs/seed';
import { getIconForFile } from '../../utils/iconResolver';
import type { VFSNode } from '../../fs/types';
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



interface DesktopProps {
  onUnfocusAll: () => void;
}

export function Desktop({ onUnfocusAll }: DesktopProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();
  const showDesktopIcons = useSettingsStore((s: any) => s.showDesktopIcons);
  const settingsWallpaper = useSettingsStore((s: any) => s.wallpaper);
  const openWindow = useWindowStore((state) => state.openWindow);
  const vfsStore = useVFSStore();
  // Explicitly subscribe to map changes
  useVFSStore((s) => s.map); 
  const desktopFiles = vfsStore.getChildren(DESKTOP_ID);

  // Fallback to default wallpaper if not set in store
  const activeWallpaper = settingsWallpaper || wallpaper;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [propertiesNode, setPropertiesNode] = useState<VFSNode | null>(null);
  const [contextNode, setContextNode] = useState<VFSNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const desktopIconOrder = useSettingsStore((s: any) => s.desktopIconOrder);
  const desktopIconPositions = useSettingsStore((s: any) => s.desktopIconPositions || {});
  const setDesktopIconPositions = useSettingsStore((s: any) => s.setDesktopIconPositions);

  const combinedIcons = useMemo(() => {
    const arr: any[] = [];
    if (showDesktopIcons) {
      arr.push(...DESKTOP_ICONS.map(i => ({ ...i, isStatic: true, type: 'static' })));
    }
    arr.push(...desktopFiles.map(f => ({ 
      ...f, 
      isStatic: false, 
      icon: getIconForFile(f.name, f.type === 'directory'), 
      label: f.name 
    })));

    if (desktopIconOrder.length > 0) {
      arr.sort((a, b) => {
        const iA = desktopIconOrder.indexOf(a.id);
        const iB = desktopIconOrder.indexOf(b.id);
        if (iA === -1 && iB === -1) return 0;
        if (iA === -1) return 1;
        if (iB === -1) return -1;
        return iA - iB;
      });
    }
    return arr;
  }, [desktopFiles, desktopIconOrder, showDesktopIcons]);

  const layoutPositions = useMemo(() => {
    const positions: Record<string, {x: number, y: number}> = {};
    const occupied = new Set<string>();

    const GRID_X = 100;
    const GRID_Y = 100;
    const OFFSET_X = 64 + 16;
    const OFFSET_Y = 32 + 16;

    for (const item of combinedIcons) {
      if (desktopIconPositions[item.id]) {
         const px = desktopIconPositions[item.id].x;
         const py = desktopIconPositions[item.id].y;
         const c = Math.round((px - OFFSET_X) / GRID_X);
         const r = Math.round((py - OFFSET_Y) / GRID_Y);
         positions[item.id] = { x: OFFSET_X + c * GRID_X, y: OFFSET_Y + r * GRID_Y };
         occupied.add(`${c},${r}`);
      }
    }

    let nextRow = 0;
    let nextCol = 0;
    const itemsPerCol = Math.max(1, Math.floor((window.innerHeight - 32) / 100));

    for (const item of combinedIcons) {
      if (!positions[item.id]) {
        while (occupied.has(`${nextCol},${nextRow}`)) {
          nextRow++;
          if (nextRow >= itemsPerCol) {
            nextRow = 0;
            nextCol++;
          }
        }
        positions[item.id] = { x: OFFSET_X + nextCol * GRID_X, y: OFFSET_Y + nextRow * GRID_Y };
        occupied.add(`${nextCol},${nextRow}`);
      }
    }

    return positions;
  }, [combinedIcons, desktopIconPositions]);

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

  const handleFileContextMenu = (e: React.MouseEvent, file: VFSNode) => {
    e.stopPropagation();
    setSelectedIcon(file.id);
    setContextNode(file);
    showContextMenu(e);
  };

  const clipboard = useVFSStore((s) => s.clipboard);

  // Determine what menu items to show based on what was right-clicked
  const menuItems = contextNode ? [
    {
      id: 'open',
      label: 'Open',
      onClick: () => {
        if (contextNode.type === 'directory') openWindow('file-manager', { cwdId: contextNode.id });
        else openWindow('text-editor', { fileId: contextNode.id });
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
      id: 'cut',
      label: 'Cut',
      onClick: () => {
        useVFSStore.getState().setClipboard('cut', contextNode.id);
        hideContextMenu();
      }
    },
    {
      id: 'copy',
      label: 'Copy',
      onClick: () => {
        useVFSStore.getState().setClipboard('copy', contextNode.id);
        hideContextMenu();
      }
    },
    { id: 'sep-2', label: '', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      onClick: () => {
        useVFSStore.getState().moveToTrash(contextNode.id);
        hideContextMenu();
      }
    },
    { id: 'sep-3', label: '', separator: true },
    {
      id: 'properties',
      label: 'Properties',
      onClick: () => {
        setPropertiesNode(contextNode);
        hideContextMenu();
      }
    }
  ] : [
    { id: 'new-folder', label: 'New Folder' },
    { id: 'new-file', label: 'New File' },
    { id: 'change-wallpaper', label: 'Change Wallpaper' },
    { id: 'sep-1', label: '', separator: true },
    {
      id: 'paste',
      label: 'Paste',
      disabled: !clipboard.nodeId,
      onClick: () => {
        const store = useVFSStore.getState();
        const { action, nodeId } = store.clipboard;
        if (!nodeId) return;
        
        if (action === 'cut') {
          store.moveNode(nodeId, DESKTOP_ID);
          store.setClipboard(null, null); // Clear clipboard after cut
        } else if (action === 'copy') {
          store.duplicateNode(nodeId, DESKTOP_ID);
        }
        hideContextMenu();
      }
    },
    { id: 'sep-2', label: '', separator: true },
    { id: 'open-terminal', label: 'Open Terminal' },
  ];

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${activeWallpaper})` }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const desktopIconId = e.dataTransfer.getData('application/x-desktop-icon');
        const nodeId = e.dataTransfer.getData('application/x-vfs-node');
        
        if (desktopIconId) {
          const rawX = e.clientX - dragOffset.x;
          const rawY = e.clientY - dragOffset.y;
          const OFFSET_X = 64 + 16;
          const OFFSET_Y = 32 + 16;
          const GRID_X = 100;
          const GRID_Y = 100;

          let targetCol = Math.round((rawX - OFFSET_X) / GRID_X);
          let targetRow = Math.round((rawY - OFFSET_Y) / GRID_Y);
          targetCol = Math.max(0, targetCol);
          targetRow = Math.max(0, targetRow);
          
          const occupied = new Set<string>();
          for (const [id, pos] of Object.entries(layoutPositions)) {
            if (id === desktopIconId) continue;
            const c = Math.round((pos.x - OFFSET_X) / GRID_X);
            const r = Math.round((pos.y - OFFSET_Y) / GRID_Y);
            occupied.add(`${c},${r}`);
          }

          let r = 0;
          let finalCol = targetCol;
          let finalRow = targetRow;
          let found = false;
          while (r < 20 && !found) {
            for (let dc = -r; dc <= r; dc++) {
              for (let dr = -r; dr <= r; dr++) {
                if (Math.max(Math.abs(dc), Math.abs(dr)) === r) {
                  const c = targetCol + dc;
                  const row = targetRow + dr;
                  if (c >= 0 && row >= 0 && !occupied.has(`${c},${row}`)) {
                    finalCol = c;
                    finalRow = row;
                    found = true;
                    break;
                  }
                }
              }
              if (found) break;
            }
            r++;
          }

          const finalX = OFFSET_X + finalCol * GRID_X;
          const finalY = OFFSET_Y + finalRow * GRID_Y;

          setDesktopIconPositions({
            ...desktopIconPositions,
            [desktopIconId]: { x: finalX, y: finalY }
          });
        }
        
        if (nodeId && !desktopIconId) {
          useVFSStore.getState().moveNode(nodeId, DESKTOP_ID);
        }
      }}
    >
      <div className="desktop__icons">
        {combinedIcons.map((item) => {
          let pos = layoutPositions[item.id];

          return (
            <div
              key={item.id}
              className={`desktop-icon${selectedIcon === item.id ? ' desktop-icon--selected' : ''}`}
              style={{ left: pos.x, top: pos.y }}
              draggable
            onDragStart={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              e.dataTransfer.setData('application/x-desktop-icon', item.id);
              if (!item.isStatic) {
                e.dataTransfer.setData('application/x-vfs-node', item.id);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (item.type === 'directory') e.stopPropagation();
            }}
            onDrop={(e) => {
              if (!item.isStatic && item.type === 'directory') {
                const nodeId = e.dataTransfer.getData('application/x-vfs-node');
                const desktopIconId = e.dataTransfer.getData('application/x-desktop-icon');
                if (nodeId && nodeId !== item.id && !desktopIconId) {
                  e.preventDefault();
                  e.stopPropagation();
                  useVFSStore.getState().moveNode(nodeId, item.id);
                }
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(item.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (item.isStatic) {
                if (item.id === 'trash') {
                  openWindow('file-manager', { cwdId: TRASH_ID });
                } else if (item.id === 'home') {
                  openWindow('file-manager', { cwdId: HOME_ID });
                }
                return;
              }
              if (item.type === 'directory') openWindow('file-manager', { cwdId: item.id });
              else openWindow('text-editor', { fileId: item.id });
            }}
            onContextMenu={(e) => {
              if (item.isStatic) {
                e.stopPropagation();
              } else {
                handleFileContextMenu(e, item);
              }
            }}
          >
            <img 
              className="desktop-icon__img" 
              src={item.icon} 
              alt={item.label} 
              draggable={false} 
            />
            {editingId === item.id && !item.isStatic ? (
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
                  color: 'var(--color-text-primary)',
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
                  if (item.isStatic) return;
                  e.stopPropagation();
                  setEditingId(item.id);
                  setEditValue(item.label);
                }}
              >
                {item.label}
              </span>
            )}
          </div>
          );
        })}
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
                const { id, error } = store.createNode(DESKTOP_ID, name, 'directory');
                console.log('Created folder:', { id, error });
                if (id) {
                  setEditingId(id);
                  setEditValue(name);
                }
              } else if (item.id === 'new-file') {
                const store = useVFSStore.getState();
                let name = 'Untitled';
                let i = 1;
                while (store.exists(DESKTOP_ID, name)) name = `Untitled ${i++}`;
                const { id, error } = store.createNode(DESKTOP_ID, name, 'file');
                console.log('Created file:', { id, error });
                if (id) {
                  setEditingId(id);
                  setEditValue(name);
                }
              }
              hideContextMenu();
            },
          }))}
        />
      )}

      {propertiesNode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999
        }} onClick={(e) => { e.stopPropagation(); setPropertiesNode(null); }}>
          <div style={{
            backgroundColor: 'var(--bg-properties)', color: 'var(--color-text-primary)', padding: '20px', borderRadius: '8px', 
            minWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Properties: {propertiesNode.name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Name:</strong> <span>{propertiesNode.name}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Type:</strong> <span>{propertiesNode.type}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Size:</strong> <span>{propertiesNode.type === 'directory' ? '4096 B' : `${new Blob([propertiesNode.content]).size} B`}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Owner:</strong> <span>{propertiesNode.owner}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Group:</strong> <span>{propertiesNode.group}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Permissions:</strong> <span>{propertiesNode.permissions}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Created:</strong> <span>{new Date(propertiesNode.createdAt).toLocaleString()}</span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Modified:</strong> <span>{new Date(propertiesNode.modifiedAt).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                style={{ padding: '6px 16px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setPropertiesNode(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
