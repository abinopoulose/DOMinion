import React, { useEffect, useRef, useCallback } from 'react';
import type { LegacyVFSNode } from '../../../fs/types';
import { FileIcon } from '../../../components/FileIcon/FileIcon';
// removed useVFSStore
import { useSettingsStore } from '../../Settings/store/useSettingsStore';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';
import { hasPermission } from '../../../fs/permissions';
import { useSelectionBox } from '../../../hooks/useSelectionBox';
import { initDynamicDrag, updateDynamicDrag, cleanupDynamicDrag } from '../../../utils/dragGhost';
import { handleHostDrop } from '../../../utils/hostInterop';
import { useNotificationStore } from '../../../components/Notifications/useNotificationStore';

interface FileGridProps {
  files: LegacyVFSNode[];
  onNavigate: (id: string) => void;
  onOpenFile: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, node?: LegacyVFSNode) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;

  editingId: string | null;
  editValue: string;
  setEditingId: (id: string | null) => void;
  setEditValue: (val: string) => void;
  onDeleteRequest: (ids: string[]) => void;
}

export function FileGrid({
  files,
  onNavigate,
  onOpenFile,
  onRename,
  onContextMenu,
  selectedIds,
  onSelectionChange,

  editingId,
  editValue,
  setEditingId,
  setEditValue,
  onDeleteRequest: _onDeleteRequest,
}: FileGridProps) {
  const selectedIdsSet = new Set(selectedIds);
  const inputRef  = useRef<HTMLInputElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const dockIconSize = useSettingsStore((s: any) => s.dockIconSize);
  
  const username     = useUbuntuAuthStore((s) => s.currentUser) || 'user';


  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // --- selection helpers ---
  const applySelection = useCallback((ids: string[]) => {
    onSelectionChange([...new Set(ids)]);
  }, [onSelectionChange]);

  const lastSelectedIndex = useRef<number | null>(null);

  const handleItemClick = useCallback((index: number, e: React.MouseEvent) => {
    const file = files[index];
    if (e.shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, index);
      const end = Math.max(lastSelectedIndex.current, index);
      const next = new Set(selectedIds);
      if (!e.ctrlKey && !e.metaKey) {
        next.clear();
      }
      for (let i = start; i <= end; i++) {
        next.add(files[i].id);
      }
      onSelectionChange([...next]);
    } else {
      let next: Set<string>;
      if (e.ctrlKey || e.metaKey) {
        next = new Set(selectedIds);
        if (next.has(file.id)) next.delete(file.id); else next.add(file.id);
      } else {
        next = new Set([file.id]);
      }
      onSelectionChange([...next]);
      lastSelectedIndex.current = index;
    }
  }, [files, selectedIds, onSelectionChange]);

  // --- rubber-band selection ---
  const { selectionRect, handlePointerDown } = useSelectionBox({
    containerRef: gridRef as React.RefObject<HTMLElement>,
    itemSelector: '[data-sel-id]',
    onSelect: applySelection,
    allowStartOnItems: false,
  });



  const commitRename = () => {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  if (files.length === 0) {
    return (
      <div
        className="fm-empty-state"
        ref={gridRef}
        onClick={() => applySelection([])}
        onContextMenu={(e) => onContextMenu(e)}
      >
        Folder is empty
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="fm-grid"
      style={{ position: 'relative', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onClick={() => applySelection([])}
      onContextMenu={(e) => onContextMenu(e)}
    >
      {files.map((file, index) => (
        <div
          key={file.id}
          /* data-sel-id is the attribute the hook queries for */
          data-sel-id={file.id}
          className={`fm-item-grid ${selectedIdsSet.has(file.id) ? 'selected' : ''}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/x-vfs-node', file.id);
            const idsToDrag = selectedIdsSet.has(file.id) ? selectedIds : [file.id];
            initDynamicDrag(e, idsToDrag, file.id, '.fm-item-grid');
            
            if (selectedIdsSet.has(file.id) && selectedIds.length > 1) {
              e.dataTransfer.setData('application/x-vfs-nodes', JSON.stringify([...selectedIds]));
            }
          }}
          onDrag={updateDynamicDrag}
          onDragEnd={cleanupDynamicDrag}
          onDragOver={(e) => {
            if (file.type === 'directory') { e.preventDefault(); e.stopPropagation(); }
          }}
          onDrop={(e) => {
            if (file.type !== 'directory') return;
            e.preventDefault(); e.stopPropagation();
            const multi = e.dataTransfer.getData('application/x-vfs-nodes');
            const single = e.dataTransfer.getData('application/x-vfs-node');
            const handleDropMove = async (ids: string[]) => {
              const { rename } = await import('../../../fs/operations');
              const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
              const targetPath = await getAbsolutePathAsync(file.id);
              for (const id of ids) {
                if (id === file.id) continue;
                try {
                  const oldPath = await getAbsolutePathAsync(id);
                  const name = oldPath.split('/').pop();
                  if (name) await rename(oldPath, `${targetPath}/${name}`);
                } catch (err) {
                  console.error(err);
                }
              }
            };

            if (multi) {
              handleDropMove(JSON.parse(multi));
            } else if (single && single !== file.id) {
              handleDropMove([single]);
            } else if (e.dataTransfer.files.length > 0) {
              const addNotification = useNotificationStore.getState().addNotification;
              const updateNotification = useNotificationStore.getState().updateNotification;
              
              const notifId = addNotification({ title: 'Uploading Files', message: 'Starting upload...', progress: 0 });
              
              handleHostDrop(e, file.id, (msg: string, current: number, total: number) => {
                updateNotification(notifId, { message: msg, progress: total > 0 ? Math.round((current / total) * 100) : 0 });
              }).then(() => {
                updateNotification(notifId, { title: 'Upload Complete', message: 'Files uploaded successfully.', progress: undefined });
              }).catch((err: any) => {
                updateNotification(notifId, { title: 'Upload Failed', message: err.message, progress: undefined });
              });
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId === file.id) return;
            handleItemClick(index, e);
            setEditingId(null);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            applySelection([]);
            if (file.type === 'directory') onNavigate(file.id);
            else onOpenFile(file.id);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            if (!selectedIdsSet.has(file.id)) handleItemClick(index, { ...e, ctrlKey: false, metaKey: false, shiftKey: false } as any);
            onContextMenu(e, file);
          }}
        >
          <div className="file-icon-container" style={{ position: 'relative', width: dockIconSize, height: dockIconSize }}>
            <FileIcon
              fileId={file.id}
              fileName={file.name}
              isDirectory={file.type === 'directory'}
              className={`fm-item-icon ${!hasPermission(file as any, 'write', username) ? 'file-item-protected' : ''}`}
              style={{ width: '100%', height: '100%' }}
            />
            {!hasPermission(file as any, 'write', username) && (
              <div className="file-lock-badge" title="Read-only">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="#e95420">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
            )}
            {file.type === 'symlink' && (
              <div style={{ position:'absolute', bottom:-2, right:-2, background:'var(--color-bg-window)', borderRadius:'50%', padding:1, boxShadow:'0 0 2px rgba(0,0,0,.5)' }} title="Symlink">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="var(--color-text-primary)"><path d="M19,15l-6,6v-4c-7.1,0-10-4.2-11-9.9c2.5,3.7,5.9,5.2,11,5.2V8L19,15z"/></svg>
              </div>
            )}
          </div>

          {editingId === file.id ? (
            <input
              ref={inputRef}
              className="fm-inline-rename"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="fm-item-name"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingId(file.id); setEditValue(file.name); }}
            >
              {file.name}
            </span>
          )}
        </div>
      ))}

      {/* Lasso rect */}
      {selectionRect && (
        <div
          style={{
            position: 'absolute',
            left:   selectionRect.x,
            top:    selectionRect.y,
            width:  selectionRect.width,
            height: selectionRect.height,
            border: '1px solid rgba(233,84,32,0.9)',
            background: 'rgba(233,84,32,0.1)',
            pointerEvents: 'none',
            borderRadius: 3,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
