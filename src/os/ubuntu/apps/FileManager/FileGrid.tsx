import React, { useEffect, useRef, useCallback } from 'react';
import type { VFSNode } from '../../fs/types';
import { getIconForFile } from '../../utils/iconResolver';
import { useVFSStore } from '../../store';
import { useSettingsStore } from '../Settings/store/useSettingsStore';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { hasPermission } from '../../fs/permissions';
import { useSelectionBox } from '../../hooks/useSelectionBox';
import { initDynamicDrag, updateDynamicDrag, cleanupDynamicDrag } from '../../utils/dragGhost';

interface FileGridProps {
  files: VFSNode[];
  onNavigate: (id: string) => void;
  onOpenFile: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, node?: VFSNode) => void;
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
  onDeleteRequest,
}: FileGridProps) {
  const selectedIdsSet = new Set(selectedIds);
  const inputRef  = useRef<HTMLInputElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const dockIconSize = useSettingsStore((s: any) => s.dockIconSize);
  const username     = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const vfsStoreMap  = useVFSStore((s) => s.map);

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

  const toggleItem = useCallback((id: string, multi: boolean) => {
    let next: Set<string>;
    if (multi) {
      next = new Set(selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
    } else {
      next = new Set([id]);
    }
    onSelectionChange([...next]);
  }, [selectedIds, onSelectionChange]);

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
      {files.map((file) => (
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
            if (multi) {
              (JSON.parse(multi) as string[]).filter(id => id !== file.id).forEach(id =>
                useVFSStore.getState().moveNode(id, file.id));
            } else if (single && single !== file.id) {
              useVFSStore.getState().moveNode(single, file.id);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId === file.id) return;
            toggleItem(file.id, e.ctrlKey || e.metaKey);
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
            if (!selectedIdsSet.has(file.id)) toggleItem(file.id, false);
            onContextMenu(e, file);
          }}
        >
          <div className="file-icon-container" style={{ position: 'relative', width: dockIconSize, height: dockIconSize }}>
            <img
              src={getIconForFile(file.name, file.type === 'directory')}
              alt={file.name}
              className={`fm-item-icon ${!hasPermission(vfsStoreMap, file.id, 'write', username) ? 'file-item-protected' : ''}`}
              draggable={false}
              style={{ width: '100%', height: '100%' }}
            />
            {!hasPermission(vfsStoreMap, file.id, 'write', username) && (
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
