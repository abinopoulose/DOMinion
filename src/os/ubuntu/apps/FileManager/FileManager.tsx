import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWindowStore, useVFSStore } from '../../store';
import { rename, moveNode, duplicateNode } from '../../fs/operations';
import { getAbsolutePathAsync } from '../../fs/pathResolver';

import { getHomeId, getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import type { LegacyVFSNode } from '../../fs/types';
import { hasPermission } from '../../fs/permissions';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { withElevation } from '../../services/sudoService';
import { TrashConfirmDialog } from '../../components/TrashConfirmDialog/TrashConfirmDialog';
import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog/DeleteConfirmDialog';
import { useFileSystem } from '../../hooks/useFileSystem';
import { handleHostDrop } from '../../utils/hostInterop';
import { useNotificationStore } from '../../components/Notifications/useNotificationStore';
import './FileManager.css';
export { FileManagerHeaderControls } from './components/FileManagerHeaderControls';

/**
 * Attempt a VFS operation. If it fails with "Permission denied",
 * open the Polkit dialog and retry with elevated privileges.
 *
 * @param operation - The VFS operation to attempt (returns error string or undefined)
 * @param actionMessage - Human-readable description for the Polkit dialog
 * @param actionId - The Polkit action ID
 * @param onSuccess - Optional callback after successful elevated operation
 */
async function attemptWithPolkit(
  operation: () => Promise<any> | any,
  actionMessage: string,
  actionId: string,
  onSuccess?: () => void
) {
  try {
    const error = await operation();
    if (error === 'Permission denied') throw new Error('Permission denied');
    if (onSuccess) onSuccess();
  } catch (error: any) {
    if (error?.message?.includes('Permission denied') || error === 'Permission denied') {
      useSystemDialogStore.getState().openPolkitDialog({
        message: actionMessage,
        actionId,
        icon: 'folder',
        onSuccess: async () => {
          try {
            const elevatedError = await withElevation(() => operation());
            if (elevatedError !== 'Permission denied' && onSuccess) onSuccess();
          } catch (e) {
            console.error('Elevated operation failed:', e);
          }
        },
      });
    } else {
      console.error('Operation failed:', error);
    }
  }
}

interface FileManagerProps {
  windowId: string;
}

interface FileManagerState {
  cwdId: string;
  viewMode: 'grid' | 'list';
  historyStack: string[];
  historyIndex: number;
  elevatedDirs: string[];  // directories accessed via Polkit elevation
  isSearching?: boolean;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showHiddenFiles?: boolean;
}

export function FileManager({ windowId }: FileManagerProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
    
  const vfsStore = useVFSStore();
   // Explicitly subscribe to map changes
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  // Context menu state to know if clicked on empty space or specific file
  const [contextNode, setContextNode] = useState<LegacyVFSNode | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [trashConfirm, setTrashConfirm] = useState<string[] | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null);

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const HOME_ID = getHomeId(username);
  const TRASH_ID = getTrashId(username);

  // Initialize app state defaults
  const defaultState: FileManagerState = {
    cwdId: HOME_ID,
    viewMode: 'grid',
    historyStack: [HOME_ID],
    historyIndex: 0,
    elevatedDirs: [],
  };

  const appState = (windowState?.appState as Partial<FileManagerState>) || {};
  
  const cwdId = appState.cwdId || defaultState.cwdId;
  const viewMode = appState.viewMode || defaultState.viewMode;
  const historyStack = appState.historyStack || [cwdId];
  const historyIndex = appState.historyIndex ?? 0;
  const elevatedDirs: string[] = appState.elevatedDirs || [];
  const isSearching = appState.isSearching || false;
  const searchQuery = appState.searchQuery || '';
  const sortBy = appState.sortBy || 'name';
  const sortOrder = appState.sortOrder || 'asc';

  const isElevated = elevatedDirs.includes(cwdId);
  const effectiveUser = isElevated ? 'root' : username;
  
  const [cwdPath, setCwdPath] = useState(`/home/${username}`);
  useEffect(() => {
    let active = true;
    getAbsolutePathAsync(cwdId).then(p => { if (active) setCwdPath(p); });
    return () => { active = false; };
  }, [cwdId]);
  
  const { nodes: fsNodes } = useFileSystem(cwdPath);

  let files = cwdId === 'starred' 
    ? (fsNodes as any[])
    : (fsNodes as any[]) || [];
  
  
  
  if (isSearching && searchQuery) {
    files = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  const showHiddenFiles = appState.showHiddenFiles || false;
  if (!showHiddenFiles) {
    files = files.filter(f => !f.name.startsWith('.'));
  }

  useEffect(() => {
    // legacy load directory is no longer needed synchronously
  }, [cwdId]);

  files = [...files].sort((a, b) => {
    // Keep directories first
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    
    let result = 0;
    
    if (sortBy === 'size') {
      const sizeA = (a as any).sizeBytes ?? (a.type === 'directory' ? 4096 : new Blob([a.content || '']).size);
      const sizeB = (b as any).sizeBytes ?? (b.type === 'directory' ? 4096 : new Blob([b.content || '']).size);
      if (sizeA !== sizeB) result = sizeB - sizeA; // Default size desc
    } else {
      result = a.name.localeCompare(b.name);
    }
    
    return sortOrder === 'desc' ? -result : result;
  });

  const updateState = (updates: Partial<FileManagerState>) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const navigateTo = async (id: string, name: string = 'directory') => {
    if (id === cwdId) return; // already there
    
    let canExecute = true;
    let nodeName = name;
    
    if (id !== 'starred' && id !== 'other-locations') {
      try {
        const { getDB } = await import('../../fs/db');
        const { hasPermission } = await import('../../fs/permissions');
        const db = await getDB();
        const node = await db.get('inodes', id);
        if (node) {
          nodeName = node.name;
          canExecute = hasPermission(node, 'execute', effectiveUser);
        }
      } catch (e) {
        console.error('Failed to resolve permissions for navigation:', e);
      }
    }

    if (!canExecute) {
      useSystemDialogStore.getState().openPolkitDialog({
        message: `Authentication is needed to access '${nodeName}'.`,
        actionId: 'org.freedesktop.filemanager.access-directory',
        icon: 'folder',
        onSuccess: () => {
          // Navigate with elevated permissions and remember this dir
          const newStack = historyStack.slice(0, historyIndex + 1);
          newStack.push(id);
          const newElevated = elevatedDirs.includes(id) ? elevatedDirs : [...elevatedDirs, id];
          updateState({
            cwdId: id,
            historyStack: newStack,
            historyIndex: newStack.length - 1,
            elevatedDirs: newElevated,
          });
        },
      });
      return;
    }

    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(id);
    updateState({
      cwdId: id,
      historyStack: newStack,
      historyIndex: newStack.length - 1,
    });
  };

  const handleOpenFile = (id: string) => {
    import('../../utils/openFile').then(({ openFileApp }) => openFileApp(id, false));
  };

  const handleRename = async (id: string, newName: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    
    // Check permission - if owner, proceed directly
    const isOwner = (file as any).ownerId === username;
    const hasLegacyPerm = (false);
    
    if (isOwner || hasLegacyPerm) {
      try {
        const { rename } = await import('../../fs/operations');
        const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
        
        const oldPath = await getAbsolutePathAsync(id);
        const segments = oldPath.split('/');
        segments.pop();
        const newPath = segments.join('/') + '/' + newName;
        
        await rename(oldPath, newPath);
      } catch (e) {
        console.error('[FileManager] rename failed', e);
      }
    } else {
      // Legacy polkit fallback if not owner
      attemptWithPolkit(
        () => rename(id, newName),
        `Authentication is needed to rename this item.`,
        'org.freedesktop.filemanager.rename'
      );
    }
  };

  const handleDeleteRequest = (ids: string[]) => {
    setTrashConfirm(ids);
  };

  const handleTrashConfirm = async () => {
    if (!trashConfirm) return;
    
    console.log(`[FileManager] Deleting items: ${trashConfirm.join(', ')}`);
    const { rename } = await import('../../fs/operations');
    const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
    
    for (const id of trashConfirm) {
      const file = files.find(f => f.id === id);
      if (file) {
        try {
          const dbModule = await import('../../fs/db');
          const db = await dbModule.getDB();
          const inode = await db.get('inodes', id);
          if (inode) {
            inode.meta = { ...inode.meta, originalParentId: inode.parentId ?? undefined };
            await db.put('inodes', inode);
          }

          const oldPath = await getAbsolutePathAsync(id);
          const newPath = `/home/${username}/.Trash/${file.name}`;
          console.log(`[FileManager] Moving ${oldPath} to ${newPath}`);
          await rename(oldPath, newPath);
        } catch (e: any) {
          console.error('[FileManager] Failed to move to trash:', e);
        }
      }
    }
    
    setSelectedIds([]);
    setTrashConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
    const { unlink, rmdir } = await import('../../fs/operations');

    for (const id of deleteConfirm) {
      const file = files.find(f => f.id === id);
      if (file) {
        try {
          const path = await getAbsolutePathAsync(id);
          if (file.type === 'directory') {
            await rmdir(path, { recursive: true });
          } else {
            await unlink(path);
          }
        } catch (e) {
          console.error('[FileManager] Failed to permanently delete:', e);
        }
      }
    }
    
    setSelectedIds([]);
    setDeleteConfirm(null);
  };

  const [propertiesNode, setPropertiesNode] = useState<LegacyVFSNode | null>(null);

  const handleContextMenu = (e: React.MouseEvent, node?: LegacyVFSNode) => {
    e.preventDefault();
    setContextNode(node);
    showMenu(e);
  };

  // Generate context menu items dynamically based on target
  const contextMenuItems = useMemo(() => {
    const clipboard = vfsStore.clipboard;
    const canWriteCwd = cwdId !== 'starred' && cwdId !== 'other-locations';
    
    const canWriteNode = contextNode 
      ? hasPermission(contextNode as any, 'write', effectiveUser)
      : false;

    if (contextNode) {
      const isMulti = selectedIds.includes(contextNode.id) && selectedIds.length > 1;

      if (cwdId === TRASH_ID) {
        const trashItems: any[] = [
          {
            id: 'restore',
            label: isMulti ? `Restore ${selectedIds.length} Items` : 'Restore',
            disabled: !canWriteNode,
            onClick: async () => {
              const ids = isMulti ? selectedIds : [contextNode.id];
              const { rename } = await import('../../fs/operations');
              const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
              const dbModule = await import('../../fs/db');
              const db = await dbModule.getDB();

              for (const id of ids) {
                try {
                  const node = await db.get('inodes', id);
                  if (node) {
                    const oldPath = await getAbsolutePathAsync(id);
                    const targetParentId = node.meta?.originalParentId || HOME_ID;
                    const targetParentPath = await getAbsolutePathAsync(targetParentId);
                    await rename(oldPath, `${targetParentPath}/${node.name}`);
                  }
                } catch (e) {
                  console.error('Failed to restore from trash', e);
                }
              }
              setSelectedIds([]);
              hideMenu();
            }
          },
          { id: 'sep-1', label: '', separator: true },
          {
            id: 'delete-permanent',
            label: isMulti ? `Delete ${selectedIds.length} Items Permanently` : 'Delete Permanently',
            icon: !canWriteNode ? 'lock' : undefined,
            onClick: () => {
              const ids = isMulti ? selectedIds : [contextNode.id];
              setDeleteConfirm(ids);
              hideMenu();
            }
          }
        ];
        if (!isMulti) {
          trashItems.push(
            { id: 'sep-2', label: '', separator: true },
            {
              id: 'properties',
              label: 'Properties',
              onClick: () => {
                setPropertiesNode(contextNode);
                hideMenu();
              }
            }
          );
        }
        return trashItems;
      }

      const menuItems: any[] = [];
      
      if (!isMulti) {
        menuItems.push(
          {
            id: 'open',
            label: 'Open',
            onClick: () => {
              if (contextNode.type === 'directory') navigateTo(contextNode.id, contextNode.name);
              else handleOpenFile(contextNode.id);
              hideMenu();
            }
          },
          {
            id: 'rename',
            label: 'Rename',
            icon: !canWriteNode ? 'lock' : undefined,
            onClick: () => {
              setEditingId(contextNode.id);
              setEditValue(contextNode.name);
              hideMenu();
            }
          },
          { id: 'sep-1', label: '', separator: true }
        );
      }

      menuItems.push(
        {
          id: 'cut',
          label: 'Cut',
          icon: !canWriteNode ? 'lock' : undefined,
          onClick: () => {
            const ids = isMulti ? selectedIds : [contextNode.id];
            vfsStore.setClipboard('cut', ids);
            hideMenu();
          }
        },
        {
          id: 'copy',
          label: 'Copy',
          onClick: () => {
            const ids = isMulti ? selectedIds : [contextNode.id];
            vfsStore.setClipboard('copy', ids);
            hideMenu();
          }
        },
        {
          id: 'download',
          label: isMulti ? `Download ${selectedIds.length} Items (ZIP)` : (contextNode.type === 'directory' ? 'Download Folder (ZIP)' : 'Download'),
          onClick: () => {
            const ids = isMulti ? selectedIds : [contextNode.id];
            if (ids.length > 1 || (ids.length === 1 && ({} as any)[ids[0]]?.type === 'directory')) {
              import('../../utils/hostInterop').then(({ downloadFilesAsZip }) => downloadFilesAsZip(ids, 'archive.zip'));
            } else {
              import('../../utils/hostInterop').then(({ downloadFile }) => downloadFile(ids[0]));
            }
            hideMenu();
          }
        },
        { id: 'sep-2', label: '', separator: true },
        {
          id: 'delete',
          label: isMulti ? `Move ${selectedIds.length} Items to Trash` : 'Move to Trash',
          icon: !canWriteNode ? 'lock' : undefined,
          onClick: () => {
            const ids = isMulti ? selectedIds : [contextNode.id];
            handleDeleteRequest(ids);
            hideMenu();
          }
        }
      );

      if (!isMulti) {
        if (contextNode.type === 'file') {
          const isStarred = contextNode.meta?.isStarred;
          menuItems.push({
            id: 'star',
            label: isStarred ? 'Unstar' : 'Star',
            onClick: async () => {
              const dbModule = await import('../../fs/db');
              const db = await dbModule.getDB();
              const node = await db.get('inodes', contextNode.id);
              if (node) {
                node.meta = { ...node.meta, isStarred: !isStarred };
                await db.put('inodes', node);
                const { fsEvents } = await import('../../fs/events');
                fsEvents.emit('/', 'fs:modified');
              }
              hideMenu();
            }
          });
          menuItems.push({ id: 'sep-star', label: '', separator: true });
        }
        
        menuItems.push(
          { id: 'sep-3', label: '', separator: true },
          {
            id: 'properties',
            label: 'Properties',
            onClick: () => {
              setPropertiesNode(contextNode);
              hideMenu();
            }
          }
        );
      }

      return menuItems;
    } else {
      return [
        {
          id: 'new-folder',
          label: 'New Folder',
          icon: !canWriteCwd ? 'lock' : undefined,
          onClick: () => {
            let name = 'New Folder';
            let i = 1;
            while (files.some(f => f.name === name)) name = `New Folder ${i++}`;
            
            attemptWithPolkit(
              async () => {
                try {
                  const { mkdir } = await import('../../fs/operations');
                  const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
                  const path = await getAbsolutePathAsync(cwdId);
                  const node = await mkdir(`${path}/${name}`);
                  setEditingId(node.id);
                  setEditValue(node.name);
                  return undefined;
                } catch (e: any) {
                  return e.message;
                }
              },
              `Authentication is needed to create a folder.`,
              'org.freedesktop.filemanager.create-folder'
            );

            hideMenu();
          }
        },
        {
          id: 'new-file',
          label: 'New File',
          icon: !canWriteCwd ? 'lock' : undefined,
          onClick: () => {
            let name = 'Untitled';
            let i = 1;
            while (files.some(f => f.name === name)) name = `Untitled ${i++}`;
            
            attemptWithPolkit(
              async () => {
                try {
                  const { writeFile } = await import('../../fs/operations');
                  const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
                  const path = await getAbsolutePathAsync(cwdId);
                  const node = await writeFile(`${path}/${name}`, '');
                  setEditingId(node.id);
                  setEditValue(node.name);
                  return undefined;
                } catch (e: any) {
                  return e.message;
                }
              },
              `Authentication is needed to create a file.`,
              'org.freedesktop.filemanager.create-file'
            );

            hideMenu();
          }
        },
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'paste',
          label: 'Paste',
          disabled: !clipboard.nodeIds || clipboard.nodeIds.length === 0,
          icon: !canWriteCwd ? 'lock' : undefined,
          onClick: () => {
            const { action, nodeIds } = clipboard;
            if (!nodeIds || nodeIds.length === 0) return;
            
            attemptWithPolkit(
              async () => {
                let firstError: string | undefined;
                if (action === 'cut') {
                  for (const id of nodeIds) {
                    try { await moveNode(id, cwdId); } catch (e: any) { firstError = e.message; }
                  }
                  if (!firstError) vfsStore.setClipboard(null, []);
                  return firstError;
                } else if (action === 'copy') {
                  for (const id of nodeIds) {
                    try { await duplicateNode(id, cwdId); } catch (e: any) { firstError = e.message; }
                  }
                  return firstError;
                }
                return undefined;
              },
              `Authentication is needed to paste into this location.`,
              'org.freedesktop.filemanager.paste'
            );
            hideMenu();
          }
        }
      ];
    }
  }, [contextNode, cwdId, vfsStore, navigateTo, hideMenu, username]);

  return (
    <div
      className="file-manager"
      tabIndex={0}
      onKeyDown={(e) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setSelectedIds(files.map(f => f.id));
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          if (selectedIds.length > 0) {
            vfsStore.setClipboard('copy', selectedIds);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
          if (selectedIds.length > 0) {
            vfsStore.setClipboard('cut', selectedIds);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
          const { action, nodeIds } = vfsStore.clipboard;
          if (action && nodeIds && nodeIds.length > 0) {
            if (action === 'cut') {
              import('../../fs/operations').then(async ({ rename }) => {
                const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
                const cwdPath = await getAbsolutePathAsync(cwdId);
                for (const id of nodeIds) {
                  const oldPath = await getAbsolutePathAsync(id);
                  const name = oldPath.split('/').pop();
                  if (name) await rename(oldPath, `${cwdPath}/${name}`).catch(console.error);
                }
                vfsStore.setClipboard(null, []);
              });
            } else if (action === 'copy') {
              // Copy is harder without operations.ts copy function, we'll keep legacy for now
              attemptWithPolkit(
                async () => {
                  let firstError: string | undefined;
                  for (const id of nodeIds) {
                    try { await duplicateNode(id, cwdId); } catch (e: any) { firstError = e.message; }
                  }
                  return firstError;
                },
                `Authentication is needed to paste into this location.`,
                'org.freedesktop.filemanager.paste'
              );
            }
          }
        } else if (e.key === 'Delete' && selectedIds.length > 0 && !editingId) {
          e.preventDefault();
          if (cwdId === TRASH_ID) {
            setDeleteConfirm([...selectedIds]);
          } else {
            setTrashConfirm([...selectedIds]);
          }
        } else if (e.key.startsWith('Arrow') && !editingId && files.length > 0) {
          e.preventDefault();
          const lastId = selectedIds[selectedIds.length - 1];
          let currentIndex = lastId ? files.findIndex(f => f.id === lastId) : -1;
          if (currentIndex === -1) currentIndex = 0;
          
          let nextIndex = currentIndex;
          if (viewMode === 'list') {
            if (e.key === 'ArrowUp') nextIndex--;
            if (e.key === 'ArrowDown') nextIndex++;
          } else {
            if (e.key === 'ArrowLeft') nextIndex--;
            if (e.key === 'ArrowRight') nextIndex++;
            // Approximate columns for grid view up/down navigation
            if (e.key === 'ArrowUp') nextIndex -= 5;
            if (e.key === 'ArrowDown') nextIndex += 5;
          }
          
          nextIndex = Math.max(0, Math.min(files.length - 1, nextIndex));
          const nextFile = files[nextIndex];
          
          if (nextFile && nextIndex !== currentIndex) {
            if (e.shiftKey) {
              const anchorId = selectedIds[0];
              const anchorIndex = anchorId ? files.findIndex(f => f.id === anchorId) : currentIndex;
              const start = Math.min(anchorIndex, nextIndex);
              const end = Math.max(anchorIndex, nextIndex);
              const nextSelected = files.slice(start, end + 1).map(f => f.id);
              setSelectedIds(nextSelected);
            } else {
              setSelectedIds([nextFile.id]);
            }
          }
        }
      }}
    >
      <Sidebar currentCwdId={cwdId} onNavigate={navigateTo} />
      
      <div className="fm-main">
        
        <div
          className="fm-content-area"
          onContextMenu={(e) => handleContextMenu(e)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const multiNodes = e.dataTransfer.getData('application/x-vfs-nodes');
            const nodeId = e.dataTransfer.getData('application/x-vfs-node');
            
            const handleDropMove = async (ids: string[]) => {
              const { rename } = await import('../../fs/operations');
              const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
              const cwdPath = await getAbsolutePathAsync(cwdId);
              for (const id of ids) {
                const oldPath = await getAbsolutePathAsync(id);
                const name = oldPath.split('/').pop();
                if (name) await rename(oldPath, `${cwdPath}/${name}`).catch(console.error);
              }
            };

            if (multiNodes) {
              handleDropMove(JSON.parse(multiNodes));
            } else if (nodeId) {
              handleDropMove([nodeId]);
            } else if (e.dataTransfer.files.length > 0) {
              const addNotification = useNotificationStore.getState().addNotification;
              const updateNotification = useNotificationStore.getState().updateNotification;
              
              const notifId = addNotification({ title: 'Uploading Files', message: 'Starting upload...', progress: 0 });
              
              handleHostDrop(e, cwdId, (msg: string, current: number, total: number) => {
                updateNotification(notifId, { message: msg, progress: total > 0 ? Math.round((current / total) * 100) : 0 });
              }).then(() => {
                updateNotification(notifId, { title: 'Upload Complete', message: 'Files uploaded successfully.', progress: undefined });
              }).catch((err: any) => {
                updateNotification(notifId, { title: 'Upload Failed', message: err.message, progress: undefined });
              });
            }
          }}
        >

          {cwdId === 'other-locations' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflowY: 'auto', margin: '-16px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)', padding: '16px 8px 8px', borderBottom: '1px solid var(--color-border)' }}>On This Device</div>
                
                <div 
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                  onClick={() => navigateTo('root')}
                  className="fm-item-list"
                >
                  <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-titlebar)', borderRadius: '8px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                      <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                      <line x1="6" y1="16" x2="6.01" y2="16"></line>
                      <line x1="10" y1="16" x2="14" y2="16"></line>
                    </svg>
                  </div>
                  <div style={{ flex: 1, paddingLeft: 12 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>Ubuntu</div>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>1.6 GB / 53.3 GB available</div>
                  <div style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginLeft: 32, paddingRight: 8 }}>/</div>
                </div>
                
                <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)', padding: '32px 8px 8px', borderBottom: '1px solid var(--color-border)' }}>Networks</div>
                <div style={{ padding: '16px 8px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>No network locations found</div>
              </div>
              
              <div style={{ background: 'var(--color-bg-titlebar)', padding: '12px 16px', display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', margin: '0 -16px -16px -16px' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: '300px' }}>
                  <input type="text" placeholder="Enter server address..." style={{ width: '100%', padding: '6px 32px 6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg-window)', color: 'var(--color-text-primary)' }} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <button style={{ padding: '6px 16px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg-window)', cursor: 'pointer', fontWeight: 500 }}>Connect</button>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="fm-empty-state">
              <svg width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 24, opacity: 0.5 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Folder is Empty</h2>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={files}
              onNavigate={navigateTo}
              onOpenFile={handleOpenFile}
              onRename={handleRename}
              onContextMenu={handleContextMenu}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDeleteRequest={handleDeleteRequest}
              editingId={editingId}
              editValue={editValue}
              setEditingId={setEditingId}
              setEditValue={setEditValue}
            />
          ) : (
            <FileList
              files={files}
              onNavigate={navigateTo}
              onOpenFile={handleOpenFile}
              onRename={handleRename}
              onContextMenu={handleContextMenu}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDeleteRequest={handleDeleteRequest}
              editingId={editingId}
              editValue={editValue}
              setEditingId={setEditingId}
              setEditValue={setEditValue}
            />
          )}
        </div>
      </div>

      {menu.isVisible && (
        <ContextMenu x={menu.x} y={menu.y} items={contextMenuItems} />
      )}

      {trashConfirm && createPortal(
        <TrashConfirmDialog
          names={trashConfirm.map(id => files.find(f => f.id === id)?.name || id)}
          onConfirm={handleTrashConfirm}
          onCancel={() => setTrashConfirm(null)}
        />,
        document.body
      )}

      {deleteConfirm && createPortal(
        <DeleteConfirmDialog
          names={deleteConfirm.map(id => files.find(f => f.id === id)?.name || id)}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />,
        document.body
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
              {(() => {
                const inode = propertiesNode as any;
                
                let sizeStr = propertiesNode.type === 'directory' ? '4096 B' : `${inode.sizeBytes ?? new Blob([propertiesNode.content || '']).size} B`;
                if (propertiesNode.type === 'proc_file' || propertiesNode.type === 'character_device') sizeStr = '0 B';

                const typeChar = propertiesNode.type === 'directory' ? 'd' : propertiesNode.type === 'symlink' ? 'l' : propertiesNode.type === 'character_device' ? 'c' : '-';
                let permStr = (propertiesNode as any).permissions?.toString(8) || '644';
                
                const rwx = permStr.padStart(3, '0').split('').map((digit: string) => {
                  const val = parseInt(digit, 8);
                  return (val & 4 ? 'r' : '-') + (val & 2 ? 'w' : '-') + (val & 1 ? 'x' : '-');
                }).join('');
                permStr = `${typeChar}${rwx}`;

                return (
                  <>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Name:</strong> <span>{propertiesNode.name}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Type:</strong> <span>{propertiesNode.type}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Inode:</strong> <span>{inode.id || 'N/A'}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Size:</strong> <span>{sizeStr}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Owner:</strong> <span>{inode.ownerId || propertiesNode.owner}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Group:</strong> <span>{inode.groupId || propertiesNode.group}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Permissions:</strong> <span>{permStr}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Created:</strong> <span>{new Date(propertiesNode.createdAt || Date.now()).toLocaleString()}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Modified:</strong> <span>{new Date(propertiesNode.modifiedAt || Date.now()).toLocaleString()}</span>
                  </>
                );
              })()}
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
