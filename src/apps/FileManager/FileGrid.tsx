import React, { useState, useEffect, useRef } from 'react';
import type { VFSNode } from '../../core/vfs/types';
import folderIcon from '../../assets/icons/file-manager.svg';
import fileIcon from '../../assets/icons/file.svg';

interface FileGridProps {
  files: VFSNode[];
  onNavigate: (id: string) => void;
  onOpenFile: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, node?: VFSNode) => void;
}

export function FileGrid({ files, onNavigate, onOpenFile, onRename, onContextMenu }: FileGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (files.length === 0) {
    return (
      <div className="fm-empty-state" onClick={handleContainerClick} onContextMenu={(e) => onContextMenu(e)}>
        Folder is empty
      </div>
    );
  }

  return (
    <div className="fm-grid" onClick={handleContainerClick} onContextMenu={(e) => onContextMenu(e)}>
      {files.map((file) => (
        <div
          key={file.id}
          className={`fm-item-grid ${selectedId === file.id ? 'selected' : ''}`}
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
        >
          <img src={file.type === 'directory' ? folderIcon : fileIcon} alt={file.name} className="fm-item-icon" draggable={false} />
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
            >
              {file.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
