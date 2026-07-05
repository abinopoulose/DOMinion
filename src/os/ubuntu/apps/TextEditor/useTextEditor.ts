import { useState, useEffect, useCallback } from 'react';
import { useWindowStore, useVFSStore } from '../../store';
import { getDesktopId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';

export function useTextEditor(windowId: string) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find(w => w.id === windowId), [windowId]));
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const vfsStore = useVFSStore();

  const appState = (windowState?.appState as { fileId?: string }) || {};
  const { fileId } = appState;

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const DESKTOP_ID = getDesktopId(username);

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
  }, [fileId, vfsStore]);

  const handleSave = useCallback(() => {
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
  }, [fileId, content, vfsStore, DESKTOP_ID, windowId, updateAppState]);

  const handleClose = useCallback(() => {
    if (content !== originalContent) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    closeWindow(windowId);
  }, [content, originalContent, closeWindow, windowId]);

  const isDirty = content !== originalContent;

  return {
    content,
    setContent,
    fileName,
    isDirty,
    handleSave,
    handleClose
  };
}
