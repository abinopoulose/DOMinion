import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { useWindowStore } from '../../../store';
import { useWindowAPI } from '../../../hooks/useWindowAPI';
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
  const { updateState: updateWindowState, getState } = useWindowAPI(windowId);
  const closeWindow = useWindowStore((s) => s.closeWindow);

  const appState = (getState<{ fileId?: string }>()) || {};
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
      setTimeout(() => {
        const stillExists = useWindowStore.getState().windows.find(w => w.id === windowId);
        if (!stillExists) {
          removeSession(windowId);
        }
      }, 0);
    };
  }, [windowId, removeSession]);

  useEffect(() => {
    let mounted = true;
    const loadFile = async () => {
      try {
        const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
        
        if (fileId) {
          const { stat, readFile } = await import('../../../fs/operations');
          const absolutePath = await getAbsolutePathAsync(fileId);
          const node = await stat(absolutePath);
          
          if (node && node.type === 'file') {
            const loc = absolutePath.substring(0, absolutePath.lastIndexOf('/')) || '/';
            const blob = await readFile(absolutePath);
            const content = await blob.text();
            
            if (mounted && session.fileName === 'Untitled Document' && session.content === '') {
              setSession(windowId, {
                content,
                originalContent: content,
                fileName: node.name,
                fileLocation: loc
              });
            }
          }
        } else {
          if (mounted && session.fileLocation === '') {
            const desktopAbsPath = await getAbsolutePathAsync(DESKTOP_ID);
            setSession(windowId, {
              fileLocation: desktopAbsPath
            });
          }
        }
      } catch (e) {
        console.error("Error loading file in TextEditor:", e);
      }
    };
    
    loadFile();
    
    return () => { mounted = false; };
  }, [fileId, DESKTOP_ID, windowId, setSession, session.fileName, session.content, session.fileLocation]);

  const handleSave = useCallback(async () => {
    const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
    const { writeFile, stat } = await import('../../../fs/operations');

    if (fileId) {
      try {
        const absolutePath = await getAbsolutePathAsync(fileId);
        await writeFile(absolutePath, new Blob([session.content]));
        setSession(windowId, { originalContent: session.content });
      } catch (err: any) {
        alert(`Failed to save: ${err.message}`);
      }
    } else {
      const name = prompt('Enter file name to save to Desktop:', 'new_file.txt');
      if (name) {
        try {
          const desktopAbsPath = await getAbsolutePathAsync(DESKTOP_ID);
          const newFilePath = desktopAbsPath === '/' ? '/' + name : desktopAbsPath + '/' + name;
          
          let exists = true;
          try {
             await stat(newFilePath);
          } catch(e) { exists = false; }
          
          if (exists) {
            alert('A file with this name already exists.');
            return;
          }
          
          await writeFile(newFilePath, new Blob([session.content]));
          const newNode = await stat(newFilePath);
          
          if (newNode) {
            updateWindowState({ fileId: newNode.id });
            setSession(windowId, { originalContent: session.content, fileName: name });
          }
        } catch (err: any) {
          alert(`Failed to create file: ${err.message}`);
        }
      }
    }
  }, [fileId, session.content, DESKTOP_ID, windowId, updateWindowState, setSession]);

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
