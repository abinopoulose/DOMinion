import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
const wallpaper = '/ubuntu_wallpaper.jpg';
const homeIcon = '/ubuntu_icons/user-home.png';
const trashIcon = '/ubuntu_icons/user-trash.png';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import { useWindowStore, useVFSStore } from '../../store';
import { getDesktopId, getHomeId, getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { getIconForFile, getSpecialFolderIconUrl } from '../../utils/iconResolver';
import type { VFSNode } from '../../fs/types';
import { hasPermission } from '../../fs/permissions';
import { useSelectionBox } from '../../hooks/useSelectionBox';
import { TrashConfirmDialog } from '../TrashConfirmDialog/TrashConfirmDialog';
import { initDynamicDrag, updateDynamicDrag, cleanupDynamicDrag } from '../../utils/dragGhost';
import './Desktop.css';

const DESKTOP_ICONS = [
  { id: 'home', label: 'Home', icon: homeIcon },
  { id: 'trash', label: 'Trash', icon: trashIcon },
];



interface DesktopProps {
  onUnfocusAll: () => void;
}

export function Desktop({ onUnfocusAll }: DesktopProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trashConfirm, setTrashConfirm] = useState<string[] | null>(null);
  // Ref on .desktop itself — it receives all pointer events
  const desktopRef = useRef<HTMLDivElement>(null);
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();
  const showDesktopIcons = useSettingsStore((s: any) => s.showDesktopIcons);
  const settingsWallpaper = useSettingsStore((s: any) => s.wallpaper);
  const openWindow = useWindowStore((state) => state.openWindow);
  const vfsStore = useVFSStore();
  // Explicitly subscribe to map changes
  useVFSStore((s) => s.map); 
  const username = useUbuntuAuthStore((s) => s.currentUser) || 'peasant';
  const DESKTOP_ID = getDesktopId(username);
  const HOME_ID = getHomeId(username);
  const TRASH_ID = getTrashId(username);

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
  const dockPosition = useSettingsStore((s: any) => s.dockPosition);
  const dockIconSize = useSettingsStore((s: any) => s.dockIconSize);
  const dockAutoHide = useSettingsStore((s: any) => s.dockAutoHide);

  const isTrashFull = vfsStore.getChildren(TRASH_ID).length > 0;
  const currentTrashIcon = isTrashFull ? '/ubuntu_icons/user-trash-full.png' : '/ubuntu_icons/user-trash.png';

  const combinedIcons = useMemo(() => {
    const arr: any[] = [];
    if (showDesktopIcons) {
      arr.push(...DESKTOP_ICONS.map(i => ({ 
        ...i, 
        icon: i.id === 'home' ? getSpecialFolderIconUrl('home') : (i.id === 'trash' ? currentTrashIcon : i.icon),
        isStatic: true, 
        type: 'static' 
      })));
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
  }, [desktopFiles, desktopIconOrder, showDesktopIcons, currentTrashIcon]);

  const layoutPositions = useMemo(() => {
    const positions: Record<string, {x: number, y: number}> = {};
    const occupied = new Set<string>();

    const dockWidth = dockAutoHide ? 0 : dockIconSize + 12;
    const GRID_X = 100;
    const GRID_Y = 100;
    const OFFSET_X = (dockPosition === 'left' ? dockWidth : 0) + 16;
    const OFFSET_Y = 28 + 16;

    const maxRow = Math.max(0, Math.floor((window.innerHeight - OFFSET_Y - (dockPosition === 'bottom' ? dockWidth : 0)) / GRID_Y) - 1);
    const maxCol = Math.max(0, Math.floor((window.innerWidth - OFFSET_X - (dockPosition === 'right' ? dockWidth : 0)) / GRID_X) - 1);

    for (const item of combinedIcons) {
      if (desktopIconPositions[item.id]) {
         const pos = desktopIconPositions[item.id];
         let c = 0, r = 0;
         
         // Use exact grid coordinates if available, otherwise migrate from absolute pixels
         if (pos.c !== undefined && pos.r !== undefined) {
           c = pos.c;
           r = pos.r;
         } else {
           c = Math.round((pos.x - OFFSET_X) / GRID_X);
           r = Math.round((pos.y - OFFSET_Y) / GRID_Y);
           c = Math.max(0, c);
           r = Math.max(0, r);
         }
         
         if (r > maxRow) {
           r = 0;
           c++;
         }
         
         // Resolve any accidental collisions
         while (occupied.has(`${c},${r}`)) {
           r++;
           if (r > maxRow) {
             r = 0;
             c++;
           }
         }
         
         // Clamp column and find first empty slot if overflowing
         if (c > maxCol) {
           let foundEmpty = false;
           for (let scanC = 0; scanC <= maxCol && !foundEmpty; scanC++) {
             for (let scanR = 0; scanR <= maxRow && !foundEmpty; scanR++) {
               if (!occupied.has(`${scanC},${scanR}`)) {
                 c = scanC;
                 r = scanR;
                 foundEmpty = true;
               }
             }
           }
         }
         
         positions[item.id] = { x: OFFSET_X + c * GRID_X, y: OFFSET_Y + r * GRID_Y };
         occupied.add(`${c},${r}`);
      }
    }

    let nextRow = 0;
    let nextCol = 0;

    for (const item of combinedIcons) {
      if (!positions[item.id]) {
        while (occupied.has(`${nextCol},${nextRow}`)) {
          nextRow++;
          if (nextRow > maxRow) {
            nextRow = 0;
            nextCol++;
          }
        }
        
        // If grid is full horizontally, don't crash, just let it overflow
        let finalCol = nextCol;
        if (finalCol > maxCol) finalCol = maxCol; 
        
        positions[item.id] = { x: OFFSET_X + finalCol * GRID_X, y: OFFSET_Y + nextRow * GRID_Y };
        occupied.add(`${finalCol},${nextRow}`);
      }
    }

    return positions;
  }, [combinedIcons, desktopIconPositions, dockPosition, dockIconSize, dockAutoHide]);

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      useVFSStore.getState().renameNode(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleIconClick = (id: string, multi: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setEditingId(null);
    desktopRef.current?.focus();
  };

  const handleDesktopClick = () => {
    setSelectedIds(new Set());
    setEditingId(null);
    onUnfocusAll();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    setContextNode(null); // click on empty desktop
    showContextMenu(e);
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: VFSNode) => {
    e.stopPropagation();
    if (!selectedIds.has(file.id)) setSelectedIds(new Set([file.id]));
    setContextNode(file);
    showContextMenu(e);
  };

  const handleDeleteRequest = (ids: string[]) => setTrashConfirm(ids);

  const handleTrashConfirm = () => {
    if (!trashConfirm) return;
    trashConfirm.forEach(id => useVFSStore.getState().moveToTrash(id));
    setSelectedIds(new Set());
    setTrashConfirm(null);
  };

  // Rubber-band selection
  // NOTE: containerRef is .desktop (not .desktop__icons which has pointer-events:none)
  // Items must have data-sel-id attribute
  const { selectionRect, handlePointerDown: handleSelectionPointerDown } = useSelectionBox({
    containerRef: desktopRef as React.RefObject<HTMLElement>,
    itemSelector: '[data-sel-id]',
    onSelect: (ids) => setSelectedIds(new Set(ids)),
    // Don't start lasso when clicking on a context menu
    shouldSkip: (t) => !!t.closest('.context-menu'),
    allowStartOnItems: false,
  });

  // Note: Keyboard events are now handled via onKeyDown on the desktop div

  const clipboard = useVFSStore((s) => s.clipboard);

  // Determine what menu items to show based on what was right-clicked
  const canWriteDesktop = hasPermission(vfsStore.map, DESKTOP_ID, 'write', username);
  const canWriteNode = contextNode ? hasPermission(vfsStore.map, contextNode.id, 'write', username) : false;

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
      disabled: !canWriteNode,
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
      disabled: !canWriteNode,
      onClick: () => {
        const ids = selectedIds.size > 1 && selectedIds.has(contextNode.id)
          ? [...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id))
          : [contextNode.id];
        useVFSStore.getState().setClipboard('cut', ids);
        hideContextMenu();
      }
    },
    {
      id: 'copy',
      label: 'Copy',
      onClick: () => {
        const ids = selectedIds.size > 1 && selectedIds.has(contextNode.id)
          ? [...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id))
          : [contextNode.id];
        useVFSStore.getState().setClipboard('copy', ids);
        hideContextMenu();
      }
    },
    { id: 'sep-2', label: '', separator: true },
    {
      id: 'delete',
      label: selectedIds.size > 1 && selectedIds.has(contextNode.id)
        ? `Move ${selectedIds.size} Items to Trash`
        : 'Move to Trash',
      disabled: !canWriteNode,
      onClick: () => {
        const ids = selectedIds.size > 1 && selectedIds.has(contextNode.id)
          ? [...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id))
          : [contextNode.id];
        handleDeleteRequest(ids);
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
    { id: 'new-folder', label: 'New Folder', disabled: !canWriteDesktop },
    { id: 'new-file', label: 'New File', disabled: !canWriteDesktop },
    { id: 'change-wallpaper', label: 'Change Wallpaper' },
    { id: 'sep-1', label: '', separator: true },
    {
      id: 'paste',
      label: 'Paste',
      disabled: !clipboard.nodeIds || clipboard.nodeIds.length === 0 || !canWriteDesktop,
      onClick: () => {
        const store = useVFSStore.getState();
        const { action, nodeIds } = store.clipboard;
        if (!nodeIds || nodeIds.length === 0) return;
        
        if (action === 'cut') {
          nodeIds.forEach(id => store.moveNode(id, DESKTOP_ID));
          store.setClipboard(null, []); // Clear clipboard after cut
        } else if (action === 'copy') {
          nodeIds.forEach(id => store.duplicateNode(id, DESKTOP_ID));
        }
        hideContextMenu();
      }
    },
    { id: 'sep-2', label: '', separator: true },
    { id: 'open-terminal', label: 'Open Terminal' },
  ];

  return (
    <div
      ref={desktopRef}
      className="desktop"
      tabIndex={0}
      style={{ backgroundImage: `url(${activeWallpaper})`, outline: 'none' }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setSelectedIds(new Set(combinedIcons.map(i => i.id)));
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          if (selectedIds.size > 0) {
            const ids = [...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id));
            if (ids.length > 0) useVFSStore.getState().setClipboard('copy', ids);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
          if (selectedIds.size > 0) {
            const ids = [...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id));
            if (ids.length > 0) useVFSStore.getState().setClipboard('cut', ids);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
          const store = useVFSStore.getState();
          const { action, nodeIds } = store.clipboard;
          if (action && nodeIds && nodeIds.length > 0 && hasPermission(store.map, DESKTOP_ID, 'write', username)) {
            if (action === 'cut') {
              nodeIds.forEach(id => store.moveNode(id, DESKTOP_ID));
              store.setClipboard(null, []);
            } else if (action === 'copy') {
              nodeIds.forEach(id => store.duplicateNode(id, DESKTOP_ID));
            }
          }
        } else if (e.key === 'Delete' && selectedIds.size > 0 && !editingId) {
          e.preventDefault();
          setTrashConfirm([...selectedIds].filter(id => !DESKTOP_ICONS.some(di => di.id === id)));
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onPointerDown={handleSelectionPointerDown}
      onDrop={(e) => {
        e.preventDefault();
        const desktopIconId = e.dataTransfer.getData('application/x-desktop-icon');
        const multi = e.dataTransfer.getData('application/x-vfs-nodes');
        const single = e.dataTransfer.getData('application/x-vfs-node');
        
        if (desktopIconId) {
          const rawX = e.clientX - dragOffset.x;
          const rawY = e.clientY - dragOffset.y;
          const dockWidth = dockAutoHide ? 0 : dockIconSize;
          const OFFSET_X = (dockPosition === 'left' ? dockWidth : 0) + 16;
          const OFFSET_Y = 28 + 16;
          const GRID_X = 100;
          const GRID_Y = 100;

          let targetCol = Math.round((rawX - OFFSET_X) / GRID_X);
          let targetRow = Math.round((rawY - OFFSET_Y) / GRID_Y);
          
          const maxRow = Math.max(0, Math.floor((window.innerHeight - OFFSET_Y - (dockPosition === 'bottom' ? dockWidth : 0)) / GRID_Y) - 1);
          const maxCol = Math.max(0, Math.floor((window.innerWidth - OFFSET_X - (dockPosition === 'right' ? dockWidth : 0)) / GRID_X) - 1);
          
          const idsToMove = selectedIds.has(desktopIconId) && selectedIds.size > 1 
            ? Array.from(selectedIds).filter(id => layoutPositions[id])
            : [desktopIconId];
            
          const occupied = new Set<string>();
          for (const [id, pos] of Object.entries(layoutPositions)) {
            if (idsToMove.includes(id)) continue;
            const c = Math.round((pos.x - OFFSET_X) / GRID_X);
            const r = Math.round((pos.y - OFFSET_Y) / GRID_Y);
            occupied.add(`${c},${r}`);
          }

          const findSlot = (tC: number, tR: number) => {
            let radius = 0;
            let startC = Math.max(0, Math.min(tC, maxCol));
            let startR = Math.max(0, Math.min(tR, maxRow));
            let found = false;
            let finalC = startC, finalR = startR;
            while (radius < 30 && !found) {
              for (let dc = -radius; dc <= radius; dc++) {
                for (let dr = -radius; dr <= radius; dr++) {
                  if (Math.max(Math.abs(dc), Math.abs(dr)) === radius) {
                    const c = startC + dc;
                    const row = startR + dr;
                    if (c >= 0 && c <= maxCol && row >= 0 && row <= maxRow && !occupied.has(`${c},${row}`)) {
                      finalC = c;
                      finalR = row;
                      found = true;
                      break;
                    }
                  }
                }
                if (found) break;
              }
              radius++;
            }
            occupied.add(`${finalC},${finalR}`);
            return { c: finalC, r: finalR };
          };

          const newPositions = { ...desktopIconPositions };
          const leadPos = layoutPositions[desktopIconId];
          const leadC = Math.round((leadPos.x - OFFSET_X) / GRID_X);
          const leadR = Math.round((leadPos.y - OFFSET_Y) / GRID_Y);

          // Place lead icon first so it gets priority for the exact slot
          const leadSlot = findSlot(targetCol, targetRow);
          newPositions[desktopIconId] = { 
            c: leadSlot.c, r: leadSlot.r, 
            x: OFFSET_X + leadSlot.c * GRID_X, y: OFFSET_Y + leadSlot.r * GRID_Y 
          };

          // Place the rest relative to the lead icon's new position
          for (const id of idsToMove) {
            if (id === desktopIconId) continue;
            const origPos = layoutPositions[id];
            const origC = Math.round((origPos.x - OFFSET_X) / GRID_X);
            const origR = Math.round((origPos.y - OFFSET_Y) / GRID_Y);
            
            const relativeTargetC = leadSlot.c + (origC - leadC);
            const relativeTargetR = leadSlot.r + (origR - leadR);
            
            const slot = findSlot(relativeTargetC, relativeTargetR);
            newPositions[id] = {
              c: slot.c, r: slot.r,
              x: OFFSET_X + slot.c * GRID_X, y: OFFSET_Y + slot.r * GRID_Y
            };
          }

          setDesktopIconPositions(newPositions);
        }
        
        if (multi && !desktopIconId) {
          (JSON.parse(multi) as string[]).forEach(id => useVFSStore.getState().moveNode(id, DESKTOP_ID));
        } else if (single && !desktopIconId) {
          useVFSStore.getState().moveNode(single, DESKTOP_ID);
        }
      }}
    >
      <div className="desktop__icons" ref={undefined} style={{ position: 'relative' }}>
        {combinedIcons.map((item) => {
          let pos = layoutPositions[item.id];

          return (
            <div
              key={item.id}
              data-sel-id={item.id}
              className={`desktop-icon${selectedIds.has(item.id) ? ' desktop-icon--selected' : ''}`}
              style={{ left: pos.x, top: pos.y, width: `${dockIconSize + 32}px` }}
              draggable
            onDragStart={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              e.dataTransfer.setData('application/x-desktop-icon', item.id);
              
              const idsToDrag = selectedIds.has(item.id) ? Array.from(selectedIds) : [item.id];
              initDynamicDrag(e, idsToDrag, item.id, '.desktop-icon');
              
              if (!item.isStatic) {
                e.dataTransfer.setData('application/x-vfs-node', item.id);
                if (selectedIds.has(item.id) && selectedIds.size > 1) {
                  e.dataTransfer.setData('application/x-vfs-nodes', JSON.stringify([...selectedIds]));
                }
              }
            }}
            onDrag={updateDynamicDrag}
            onDragEnd={cleanupDynamicDrag}
            onDragOver={(e) => {
              e.preventDefault();
              if (item.type === 'directory') e.stopPropagation();
            }}
            onDrop={(e) => {
              if (!item.isStatic && item.type === 'directory') {
                const multi = e.dataTransfer.getData('application/x-vfs-nodes');
                const single = e.dataTransfer.getData('application/x-vfs-node');
                if (multi) {
                  e.preventDefault();
                  e.stopPropagation();
                  (JSON.parse(multi) as string[]).filter(id => id !== item.id).forEach(id =>
                    useVFSStore.getState().moveNode(id, item.id));
                } else if (single && single !== item.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  useVFSStore.getState().moveNode(single, item.id);
                }
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(item.id, e.ctrlKey || e.metaKey);
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
              style={{ width: `${dockIconSize + 8}px`, height: `${dockIconSize + 8}px` }}
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

      {/* Rubber-band selection box on desktop */}
      {selectionRect && (
        <div
          style={{
            position: 'absolute',
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            border: '1px solid rgba(233,84,32,0.8)',
            background: 'rgba(233,84,32,0.12)',
            pointerEvents: 'none',
            borderRadius: '2px',
            zIndex: 100,
          }}
        />
      )}

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

      {trashConfirm && trashConfirm.length > 0 && createPortal(
        <TrashConfirmDialog
          names={trashConfirm.map(id => combinedIcons.find(i => i.id === id)?.label || id)}
          onConfirm={handleTrashConfirm}
          onCancel={() => setTrashConfirm(null)}
        />,
        document.body
      )}
    </div>
  );
}
