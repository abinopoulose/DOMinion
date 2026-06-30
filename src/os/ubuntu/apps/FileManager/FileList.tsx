import React, { useState, useEffect, useRef } from 'react';
import type { VFSNode } from '../../fs/types';
import { getIconForFile } from '../../utils/iconResolver';
import { useVFSStore } from '../../store';
import { useSettingsStore } from '../Settings/store/useSettingsStore';

interface FileListProps {
  files: VFSNode[];
  onNavigate: (id: string) => void;
  onOpenFile: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, node?: VFSNode) => void;
  editingId: string | null;
  editValue: string;
  setEditingId: (id: string | null) => void;
  setEditValue: (val: string) => void;
}

export function FileList({ files, onNavigate, onOpenFile, onRename, onContextMenu, editingId, editValue, setEditingId, setEditValue }: FileListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockIconSize = useSettingsStore((s: any) => s.dockIconSize);
  const listIconSize = Math.max(16, Math.floor(dockIconSize / 2));

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleContainerClick = () => {
    setSelectedId(null);
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
          className={`fm-item-list ${selectedId === file.id ? 'selected' : ''}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/x-vfs-node', file.id);
          }}
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
              const nodeId = e.dataTransfer.getData('application/x-vfs-node');
              if (nodeId && nodeId !== file.id) {
                useVFSStore.getState().moveNode(nodeId, file.id);
              }
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId === file.id) return;
            setSelectedId(file.id);
            setEditingId(null);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (file.type === 'directory') onNavigate(file.id);
            else onOpenFile(file.id);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            setSelectedId(file.id);
            onContextMenu(e, file);
          }}
          style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '4px 8px', gap: '8px' }}
        >
          <img src={getIconForFile(file.name, file.type === 'directory')} alt={file.name} className="fm-item-icon" draggable={false} style={{ width: listIconSize, height: listIconSize }} />
          
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
