import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { useWindowStore, useVFSStore } from '../../../store';
import { getDesktopId } from '../../../fs/seed';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';

interface TextEditorSession {
  content: string;
  originalContent: string;
  fileName: string;
  fileLocation: string;
}

interface TextEditorState {
  sessions: Record<string, TextEditorSession>;
  setSession: (id: string, data: Partial<TextEditorSession>) => void;
  removeSession: (id: string) => void;
}

const useEditorStore = create<TextEditorState>((set) => ({
  sessions: {},
  setSession: (id, data) => set((s) => ({
    sessions: {
      ...s.sessions,
      [id]: { ...(s.sessions[id] || { content: '', originalContent: '', fileName: 'Untitled Document', fileLocation: '' }), ...data }
    }
  })),
  removeSession: (id) => set((s) => {
    const { [id]: _, ...rest } = s.sessions;
    return { sessions: rest };
  }),
}));

export function useTextEditor(windowId: string) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find(w => w.id === windowId), [windowId]));
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const vfsStore = useVFSStore();

  const appState = (windowState?.appState as { fileId?: string }) || {};
  const { fileId } = appState;

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const DESKTOP_ID = getDesktopId(username);

  const session = useEditorStore((s) => s.sessions[windowId]) || {
    content: '',
    originalContent: '',
    fileName: 'Untitled Document',
    fileLocation: ''
  };
  const setSession = useEditorStore((s) => s.setSession);
  const removeSession = useEditorStore((s) => s.removeSession);

  // Clean up session when window is closed (or component is unmounted and window doesn't exist)
  useEffect(() => {
    return () => {
      // Small timeout to allow check if window was actually closed
      setTimeout(() => {
        const stillExists = useWindowStore.getState().windows.find(w => w.id === windowId);
        if (!stillExists) {
          removeSession(windowId);
        }
      }, 0);
    };
  }, [windowId, removeSession]);

  useEffect(() => {
    if (fileId) {
      const node = vfsStore.getNode(fileId);
      if (node && node.type === 'file') {
        const absolutePath = vfsStore.getAbsolutePath(fileId);
        const loc = absolutePath.substring(0, absolutePath.lastIndexOf('/')) || '/';
        
        // Only load if not already loaded to prevent overriding user edits if re-rendered
        if (session.fileName === 'Untitled Document' && session.content === '') {
          setSession(windowId, {
            content: node.content,
            originalContent: node.content,
            fileName: node.name,
            fileLocation: loc
          });
        }
      }
    } else {
      if (session.fileLocation === '') {
        setSession(windowId, {
          fileLocation: vfsStore.getAbsolutePath(DESKTOP_ID)
        });
      }
    }
  }, [fileId, vfsStore, DESKTOP_ID, windowId, setSession, session.fileName, session.content, session.fileLocation]);

  const handleSave = useCallback(() => {
    if (fileId) {
      const err = vfsStore.updateContent(fileId, session.content);
      if (!err) {
        setSession(windowId, { originalContent: session.content });
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
        const { error: err } = vfsStore.createNode(DESKTOP_ID, name, 'file', session.content);
        if (err) {
          alert(`Failed to create file: ${err}`);
        } else {
          const newNode = vfsStore.getChildren(DESKTOP_ID).find(c => c.name === name);
          if (newNode) {
            updateAppState(windowId, { fileId: newNode.id });
            setSession(windowId, { originalContent: session.content, fileName: name });
          }
        }
      }
    }
  }, [fileId, session.content, vfsStore, DESKTOP_ID, windowId, updateAppState, setSession]);

  const handleClose = useCallback(() => {
    if (session.content !== session.originalContent) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    closeWindow(windowId);
  }, [session.content, session.originalContent, closeWindow, windowId]);

  const isDirty = session.content !== session.originalContent;

  const setContent = useCallback((content: string) => setSession(windowId, { content }), [windowId, setSession]);

  return {
    content: session.content,
    setContent,
    fileName: session.fileName,
    fileLocation: session.fileLocation,
    isDirty,
    handleSave,
    handleClose
  };
}
