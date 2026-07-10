import React, { useEffect, useRef } from 'react';
import type { VFSNode } from '../../fs/types';
import { getIconForFile } from '../../utils/iconResolver';
import { useVFSStore } from '../../store';
import { useSettingsStore } from '../Settings/store/useSettingsStore';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { hasPermission } from '../../fs/permissions';
import { initDynamicDrag, updateDynamicDrag, cleanupDynamicDrag } from '../../utils/dragGhost';

interface FileListProps {
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

export function FileList({
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
}: FileListProps) {
  const selectedIdsSet = new Set(selectedIds);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockIconSize = useSettingsStore((s: any) => s.dockIconSize);
  
  const listIconSize = Math.max(16, Math.floor(dockIconSize / 2));
  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const vfsStoreMap = useVFSStore((s) => s.map);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const toggleItem = (id: string, multi: boolean) => {
    let next: Set<string>;
    if (multi) {
      next = new Set(selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
    } else {
      next = new Set([id]);
    }
    onSelectionChange([...next]);
  };

  const handleContainerClick = () => {
    onSelectionChange([]);
    setEditingId(null);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (files.length === 0) {
    return (
      <div className="fm-empty-state" onClick={handleContainerClick} onContextMenu={(e) => onContextMenu(e)}>
        Folder is empty
      </div>
    );
  }

  return (
    <div className="fm-list" onClick={handleContainerClick} onContextMenu={(e) => onContextMenu(e)}>
      <div className="fm-list-header" style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr', padding: '8px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 'bold' }}>
        <span></span>
        <span>Name</span>
        <span>Size</span>
        <span>Owner</span>
        <span>Group</span>
        <span>Perms</span>
        <span>Modified</span>
      </div>
      {files.map((file) => (
        <div
          key={file.id}
          data-sel-id={file.id}
          className={`fm-item-list ${selectedIdsSet.has(file.id) ? 'selected' : ''}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/x-vfs-node', file.id);
            const idsToDrag = selectedIdsSet.has(file.id) ? selectedIds : [file.id];
            initDynamicDrag(e, idsToDrag, file.id, '.fm-item-list');
            
            if (selectedIdsSet.has(file.id) && selectedIds.length > 1) {
              e.dataTransfer.setData('application/x-vfs-nodes', JSON.stringify([...selectedIds]));
            }
          }}
          onDrag={updateDynamicDrag}
          onDragEnd={cleanupDynamicDrag}
          onDragOver={(e) => {
            if (file.type === 'directory') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDrop={(e) => {
            if (file.type === 'directory') {
              e.preventDefault();
              e.stopPropagation();
              const multi = e.dataTransfer.getData('application/x-vfs-nodes');
              const single = e.dataTransfer.getData('application/x-vfs-node');
              if (multi) {
                (JSON.parse(multi) as string[]).filter(id => id !== file.id).forEach(id =>
                  useVFSStore.getState().moveNode(id, file.id));
              } else if (single && single !== file.id) {
                useVFSStore.getState().moveNode(single, file.id);
              }
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
            if (file.type === 'directory') onNavigate(file.id);
            else onOpenFile(file.id);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            if (!selectedIdsSet.has(file.id)) toggleItem(file.id, false);
            onContextMenu(e, file);
          }}
          style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '4px 8px', gap: '8px' }}
        >
          <div className="file-icon-container" style={{ position: 'relative', width: listIconSize, height: listIconSize }}>
            <img src={getIconForFile(file.name, file.type === 'directory')} alt={file.name} className={`fm-item-icon ${!hasPermission(vfsStoreMap, file.id, 'write', username) ? 'file-item-protected' : ''}`} draggable={false} style={{ width: '100%', height: '100%' }} />
            {!hasPermission(vfsStoreMap, file.id, 'write', username) && (
              <div className="file-lock-badge" title="This item is read-only">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="#e95420">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
            )}
            {file.type === 'symlink' && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--color-bg-window)', borderRadius: '50%', padding: '1px', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} title="Symbolic link">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="var(--color-text-primary)"><path d="M19,15l-6,6v-4c-7.1,0-10-4.2-11-9.9c2.5,3.7,5.9,5.2,11,5.2V8L19,15z"/></svg>
              </div>
            )}
            {(file.type === 'character_device' || file.type === 'proc_file') && (
              <div style={{ position: 'absolute', top: -2, right: -2, background: 'var(--color-bg-window)', borderRadius: '50%', padding: '1px', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} title="Virtual Device">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="var(--color-accent)"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="fm-item-name"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(file.id);
                setEditValue(file.name);
              }}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {file.name}
            </span>
          )}
          
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
            {file.type === 'directory' ? '--' : `${file.content.length} B`}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
            {file.owner}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
            {file.group}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
            {file.permissions}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
            {formatDate(file.modifiedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
