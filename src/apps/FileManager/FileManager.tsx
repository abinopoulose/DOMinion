import React, { useCallback, useMemo, useState } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { HOME_ID } from '../../core/vfs/seed';
import { Sidebar } from './Sidebar';
import { BreadcrumbBar } from './BreadcrumbBar';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import type { VFSNode } from '../../core/vfs/types';
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
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  // Context menu state to know if clicked on empty space or specific file
  const [contextNode, setContextNode] = useState<VFSNode | undefined>(undefined);

  // Initialize app state
  const appState = (windowState?.appState as FileManagerState) || {
    cwdId: HOME_ID,
    viewMode: 'grid',
    historyStack: [HOME_ID],
    historyIndex: 0,
  };

  const { cwdId, viewMode, historyStack, historyIndex } = appState;

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
    // Phase 5/6: Open file
    // Ideally open text viewer, but for now open terminal or just no-op
    openWindow('terminal'); 
  };

  const handleRename = (id: string, newName: string) => {
    vfsStore.renameNode(id, newName);
  };

  const handleContextMenu = (e: React.MouseEvent, node?: VFSNode) => {
    e.preventDefault();
    setContextNode(node);
    showMenu(e);
  };

  // Generate context menu items dynamically based on target
  const contextMenuItems = useMemo(() => {
    if (contextNode) {
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
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'delete',
          label: 'Delete',
          onClick: () => {
            // Note: recursive delete for non-empty folders isn't prompted here, just forces it.
            // In a real app we'd show a modal.
            vfsStore.deleteNode(contextNode.id);
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
            vfsStore.createNode(cwdId, name, 'directory');
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
            vfsStore.createNode(cwdId, name, 'file');
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
        
        <div className="fm-content-area" onContextMenu={(e) => handleContextMenu(e)}>
          {viewMode === 'grid' ? (
            <FileGrid 
              files={files} 
              onNavigate={navigateTo} 
              onOpenFile={handleOpenFile} 
              onRename={handleRename}
              onContextMenu={handleContextMenu}
            />
          ) : (
            <FileList 
              files={files} 
              onNavigate={navigateTo} 
              onOpenFile={handleOpenFile} 
              onRename={handleRename}
              onContextMenu={handleContextMenu}
            />
          )}
        </div>
      </div>

      {menu.isVisible && (
        <ContextMenu x={menu.x} y={menu.y} items={contextMenuItems} />
      )}
    </div>
  );
}
