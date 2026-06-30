import React, { useCallback, useMemo, useState } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { HOME_ID, TRASH_ID } from '../../fs/seed';
import { Sidebar } from './Sidebar';
import { BreadcrumbBar } from './BreadcrumbBar';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import type { VFSNode } from '../../fs/types';
import './FileManager.css';

interface FileManagerProps {
  windowId: string;
}

interface FileManagerState {
  cwdId: string;
  viewMode: 'grid' | 'list';
  historyStack: string[];
  historyIndex: number;
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

  // Initialize app state defaults
  const defaultState: FileManagerState = {
    cwdId: HOME_ID,
    viewMode: 'grid',
    historyStack: [HOME_ID],
    historyIndex: 0,
  };

  const appState = (windowState?.appState as Partial<FileManagerState>) || {};
  
  const cwdId = appState.cwdId || defaultState.cwdId;
  const viewMode = appState.viewMode || defaultState.viewMode;
  const historyStack = appState.historyStack || [cwdId];
  const historyIndex = appState.historyIndex ?? 0;

  const files = vfsStore.getChildren(cwdId);

  const updateState = (updates: Partial<FileManagerState>) => {
    updateAppState(windowId, { ...appState, ...updates });
  };

  const navigateTo = (id: string) => {
    if (id === cwdId) return; // already there
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
    vfsStore.renameNode(id, newName);
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
    if (contextNode) {
      if (cwdId === TRASH_ID) {
        return [
          {
            id: 'restore',
            label: 'Restore',
            onClick: () => {
              vfsStore.restoreFromTrash(contextNode.id);
              hideMenu();
            }
          },
          { id: 'sep-1', label: '', separator: true },
          {
            id: 'delete-permanent',
            label: 'Delete Permanently',
            onClick: () => {
              vfsStore.deleteNode(contextNode.id);
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
            if (contextNode.type === 'directory') navigateTo(contextNode.id);
            else handleOpenFile(contextNode.id);
            hideMenu();
          }
        },
        {
          id: 'rename',
          label: 'Rename',
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
          onClick: () => {
            vfsStore.moveToTrash(contextNode.id);
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
          onClick: () => {
            let name = 'New Folder';
            let i = 1;
            while (vfsStore.exists(cwdId, name)) name = `New Folder ${i++}`;
            const { id } = vfsStore.createNode(cwdId, name, 'directory');
            if (id) {
              setEditingId(id);
              setEditValue(name);
            }
            hideMenu();
          }
        },
        {
          id: 'new-file',
          label: 'New File',
          onClick: () => {
            let name = 'Untitled';
            let i = 1;
            while (vfsStore.exists(cwdId, name)) name = `Untitled ${i++}`;
            const { id } = vfsStore.createNode(cwdId, name, 'file');
            if (id) {
              setEditingId(id);
              setEditValue(name);
            }
            hideMenu();
          }
        },
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'paste',
          label: 'Paste',
          disabled: !clipboard.nodeId,
          onClick: () => {
            const { action, nodeId } = clipboard;
            if (!nodeId) return;
            
            if (action === 'cut') {
              vfsStore.moveNode(nodeId, cwdId);
              vfsStore.setClipboard(null, null); // Clear clipboard after cut
            } else if (action === 'copy') {
              vfsStore.duplicateNode(nodeId, cwdId);
            }
            hideMenu();
          }
        }
      ];
    }
  }, [contextNode, cwdId, vfsStore, navigateTo, hideMenu]);

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
