import React, { useCallback, useMemo, useState } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { getHomeId, getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { Sidebar } from './Sidebar';
import { BreadcrumbBar } from './BreadcrumbBar';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import type { VFSNode } from '../../fs/types';
import { hasPermission } from '../../fs/permissions';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { withElevation } from '../../services/sudoService';
import './FileManager.css';

/**
 * Attempt a VFS operation. If it fails with "Permission denied",
 * open the Polkit dialog and retry with elevated privileges.
 *
 * @param operation - The VFS operation to attempt (returns error string or undefined)
 * @param actionMessage - Human-readable description for the Polkit dialog
 * @param actionId - The Polkit action ID
 * @param onSuccess - Optional callback after successful elevated operation
 */
function attemptWithPolkit(
  operation: () => string | undefined,
  actionMessage: string,
  actionId: string,
  onSuccess?: () => void
) {
  // First, try without elevation
  const error = operation();

  if (error === 'Permission denied') {
    // Open Polkit dialog
    useSystemDialogStore.getState().openPolkitDialog({
      message: actionMessage,
      actionId,
      icon: 'folder',
      onSuccess: () => {
        // Retry with elevation
        const elevatedError = withElevation(() => operation());
        if (!elevatedError && onSuccess) {
          onSuccess();
        }
      },
    });
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
}

export function FileManager({ windowId }: FileManagerProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const openWindow = useWindowStore((s) => s.openWindow);
  
  const vfsStore = useVFSStore();
  useVFSStore((s) => s.map); // Explicitly subscribe to map changes
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  // Context menu state to know if clicked on empty space or specific file
  const [contextNode, setContextNode] = useState<VFSNode | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const isElevated = elevatedDirs.includes(cwdId);
  const effectiveUser = isElevated ? 'root' : username;
  const files = vfsStore.getChildren(cwdId, effectiveUser);

  const updateState = (updates: Partial<FileManagerState>) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const navigateTo = (id: string, name: string = 'directory') => {
    if (id === cwdId) return; // already there
    
    const canExecute = hasPermission(vfsStore.map, id, 'execute', username);

    if (!canExecute) {
      useSystemDialogStore.getState().openPolkitDialog({
        message: `Authentication is needed to access '${name}'.`,
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

  const goBack = () => {
    if (historyIndex > 0) {
      updateState({
        cwdId: historyStack[historyIndex - 1],
        historyIndex: historyIndex - 1,
      });
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      updateState({
        cwdId: historyStack[historyIndex + 1],
        historyIndex: historyIndex + 1,
      });
    }
  };

  const handleOpenFile = (id: string) => {
    openWindow('text-editor', { fileId: id }); 
  };

  const handleRename = (id: string, newName: string) => {
    attemptWithPolkit(
      () => vfsStore.renameNode(id, newName),
      `Authentication is needed to rename this item.`,
      'org.freedesktop.filemanager.rename'
    );
  };

  const [propertiesNode, setPropertiesNode] = useState<VFSNode | null>(null);

  const handleContextMenu = (e: React.MouseEvent, node?: VFSNode) => {
    e.preventDefault();
    setContextNode(node);
    showMenu(e);
  };

  // Generate context menu items dynamically based on target
  const contextMenuItems = useMemo(() => {
    const clipboard = vfsStore.clipboard;
    const canWriteCwd = hasPermission(vfsStore.map, cwdId, 'write', effectiveUser);
    const canWriteNode = contextNode ? hasPermission(vfsStore.map, contextNode.id, 'write', effectiveUser) : false;

    if (contextNode) {
      if (cwdId === TRASH_ID) {
        return [
          {
            id: 'restore',
            label: 'Restore',
            disabled: !canWriteNode,
            onClick: () => {
              vfsStore.restoreFromTrash(contextNode.id);
              hideMenu();
            }
          },
          { id: 'sep-1', label: '', separator: true },
          {
            id: 'delete-permanent',
            label: 'Delete Permanently',
            icon: !canWriteNode ? 'lock' : undefined,
            onClick: () => {
              attemptWithPolkit(
                () => vfsStore.deleteNode(contextNode.id),
                `Authentication is needed to delete '${contextNode.name}'.`,
                'org.freedesktop.filemanager.delete'
              );
              hideMenu();
            }
          },
          { id: 'sep-2', label: '', separator: true },
          {
            id: 'properties',
            label: 'Properties',
            onClick: () => {
              setPropertiesNode(contextNode);
              hideMenu();
            }
          }
        ];
      }

      return [
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
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'cut',
          label: 'Cut',
          icon: !canWriteNode ? 'lock' : undefined,
          onClick: () => {
            vfsStore.setClipboard('cut', contextNode.id);
            hideMenu();
          }
        },
        {
          id: 'copy',
          label: 'Copy',
          onClick: () => {
            vfsStore.setClipboard('copy', contextNode.id);
            hideMenu();
          }
        },
        { id: 'sep-2', label: '', separator: true },
        {
          id: 'delete',
          label: 'Delete',
          icon: !canWriteNode ? 'lock' : undefined,
          onClick: () => {
            attemptWithPolkit(
              () => vfsStore.moveToTrash(contextNode.id),
              `Authentication is needed to delete '${contextNode.name}'.`,
              'org.freedesktop.filemanager.delete'
            );
            hideMenu();
          }
        },
        { id: 'sep-3', label: '', separator: true },
        {
          id: 'properties',
          label: 'Properties',
          onClick: () => {
            setPropertiesNode(contextNode);
            hideMenu();
          }
        }
      ];
    } else {
      return [
        {
          id: 'new-folder',
          label: 'New Folder',
          icon: !canWriteCwd ? 'lock' : undefined,
          onClick: () => {
            let name = 'New Folder';
            let i = 1;
            while (vfsStore.exists(cwdId, name)) name = `New Folder ${i++}`;
            
            attemptWithPolkit(
              () => vfsStore.createNode(cwdId, name, 'directory').error,
              `Authentication is needed to create a folder.`,
              'org.freedesktop.filemanager.create-folder',
              () => {
                const node = vfsStore.getChildren(cwdId).find(n => n.name === name);
                if (node) {
                  setEditingId(node.id);
                  setEditValue(node.name);
                }
              }
            );

            // Attempt logic without elevation already creates node if success, wait, we need to handle success here if it succeeded on first try
            if (hasPermission(vfsStore.map, cwdId, 'write', username)) {
               const node = vfsStore.getChildren(cwdId).find(n => n.name === name);
               if (node) {
                 setEditingId(node.id);
                 setEditValue(node.name);
               }
            }
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
            while (vfsStore.exists(cwdId, name)) name = `Untitled ${i++}`;
            
            attemptWithPolkit(
              () => vfsStore.createNode(cwdId, name, 'file').error,
              `Authentication is needed to create a file.`,
              'org.freedesktop.filemanager.create-file',
              () => {
                const node = vfsStore.getChildren(cwdId).find(n => n.name === name);
                if (node) {
                  setEditingId(node.id);
                  setEditValue(node.name);
                }
              }
            );

            if (hasPermission(vfsStore.map, cwdId, 'write', username)) {
               const node = vfsStore.getChildren(cwdId).find(n => n.name === name);
               if (node) {
                 setEditingId(node.id);
                 setEditValue(node.name);
               }
            }
            hideMenu();
          }
        },
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'paste',
          label: 'Paste',
          disabled: !clipboard.nodeId,
          icon: !canWriteCwd ? 'lock' : undefined,
          onClick: () => {
            const { action, nodeId } = clipboard;
            if (!nodeId) return;
            
            attemptWithPolkit(
              () => {
                if (action === 'cut') {
                  const err = vfsStore.moveNode(nodeId, cwdId);
                  if (!err) vfsStore.setClipboard(null, null);
                  return err;
                } else if (action === 'copy') {
                  return vfsStore.duplicateNode(nodeId, cwdId).error;
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
    <div className="file-manager">
      <Sidebar currentCwdId={cwdId} onNavigate={navigateTo} />
      
      <div className="fm-main">
        <BreadcrumbBar
          currentCwdId={cwdId}
          onNavigate={navigateTo}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < historyStack.length - 1}
          onBack={goBack}
          onForward={goForward}
          viewMode={viewMode}
          onViewModeChange={(mode) => updateState({ viewMode: mode })}
        />
        
        <div 
          className="fm-content-area" 
          onContextMenu={(e) => handleContextMenu(e)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const nodeId = e.dataTransfer.getData('application/x-vfs-node');
            if (nodeId) {
              useVFSStore.getState().moveNode(nodeId, cwdId);
            }
          }}
        >
          {viewMode === 'grid' ? (
            <FileGrid 
              files={files} 
              onNavigate={navigateTo} 
              onOpenFile={handleOpenFile} 
              onRename={handleRename}
              onContextMenu={handleContextMenu}
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
                const storeState = useVFSStore.getState();
                const ino = storeState.idToIno[propertiesNode.id];
                const inode = ino ? storeState.inodeTable[ino] : null;
                
                let sizeStr = propertiesNode.type === 'directory' ? '4096 B' : `${new Blob([propertiesNode.content]).size} B`;
                if (propertiesNode.type === 'proc_file' || propertiesNode.type === 'character_device') sizeStr = '0 B';
                if (inode) sizeStr = `${inode.size} B`;

                const typeChar = propertiesNode.type === 'directory' ? 'd' : propertiesNode.type === 'symlink' ? 'l' : propertiesNode.type === 'character_device' ? 'c' : '-';
                let permStr = propertiesNode.permissions || '644';
                if (inode) {
                  permStr = inode.permissions.toString(8);
                  const rwx = permStr.padStart(3, '0').split('').map(digit => {
                    const val = parseInt(digit, 8);
                    return (val & 4 ? 'r' : '-') + (val & 2 ? 'w' : '-') + (val & 1 ? 'x' : '-');
                  }).join('');
                  permStr = `${typeChar}${rwx}`;
                }

                return (
                  <>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Name:</strong> <span>{propertiesNode.name}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Type:</strong> <span>{propertiesNode.type}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Inode:</strong> <span>{inode ? inode.ino : 'N/A'}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Hard Links:</strong> <span>{inode ? inode.links : 1}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Size:</strong> <span>{sizeStr}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Owner:</strong> <span>{propertiesNode.owner}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Group:</strong> <span>{propertiesNode.group}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Permissions:</strong> <span>{permStr}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Created:</strong> <span>{new Date(propertiesNode.createdAt).toLocaleString()}</span>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Modified:</strong> <span>{new Date(propertiesNode.modifiedAt).toLocaleString()}</span>
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
