import React, { useState, useEffect, useCallback } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { DESKTOP_ID } from '../../fs/seed';
import './TextEditor.css';

interface TextEditorProps {
  windowId: string;
}

export function TextEditor({ windowId }: TextEditorProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find(w => w.id === windowId), [windowId]));
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const vfsStore = useVFSStore();

  const appState = (windowState?.appState as { fileId?: string }) || {};
  const { fileId } = appState;

  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [fileName, setFileName] = useState('Untitled Document');

  useEffect(() => {
    if (fileId) {
      const node = vfsStore.getNode(fileId);
      if (node && node.type === 'file') {
        setContent(node.content);
        setOriginalContent(node.content);
        setFileName(node.name);
      }
    }
  }, [fileId]); // Only run when fileId changes

  const handleSave = () => {
    if (fileId) {
      const err = vfsStore.updateContent(fileId, content);
      if (!err) {
        setOriginalContent(content);
      } else {
        alert(`Failed to save: ${err}`);
      }
    } else {
      const name = prompt('Enter file name to save to Desktop:', 'new_file.txt');
      if (name) {
        if (vfsStore.exists(DESKTOP_ID, name)) {
          alert('A file with this name already exists.');
          return;
        }
        const { error: err } = vfsStore.createNode(DESKTOP_ID, name, 'file', content);
        if (err) {
          alert(`Failed to create file: ${err}`);
        } else {
          const newNode = vfsStore.getChildren(DESKTOP_ID).find(c => c.name === name);
          if (newNode) {
            updateAppState(windowId, { fileId: newNode.id });
            setOriginalContent(content);
            setFileName(name);
          }
        }
      }
    }
  };

  const handleClose = () => {
    if (content !== originalContent) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    closeWindow(windowId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const isDirty = content !== originalContent;

  return (
    <div className="text-editor">
      <div className="text-editor-toolbar">
        <button className="primary" onClick={handleSave}>
          Save
        </button>
        <button onClick={handleClose}>
          Close
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {fileName}{isDirty ? ' •' : ''}
        </span>
      </div>
      <textarea
        className="text-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  );
}
