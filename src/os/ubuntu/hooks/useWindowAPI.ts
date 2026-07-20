import { useCallback } from 'react';
import { useWindowStore } from '../store';
// WindowState import removed

export interface WindowAPI {
  /** The current ID of this window */
  id: string;
  /** Set the title of the window */
  setTitle: (newTitle: string) => void;
  /** Resize the window */
  resizeTo: (width: number, height: number) => void;
  /** Focus the window and bring it to front */
  requestAttention: () => void;
  /** Update the application-specific state */
  updateState: (newState: unknown) => void;
  /** Get the current application state */
  getState: <T>() => T | undefined;
}

export function useWindowAPI(windowId: string): WindowAPI {
  const updateWindowTitle = useWindowStore(s => s.updateWindowTitle);
  const updateSize = useWindowStore(s => s.updateSize);
  const focusWindow = useWindowStore(s => s.focusWindow);
  const updateAppState = useWindowStore(s => s.updateAppState);
  const getWindow = useCallback(() => {
    return useWindowStore.getState().windows.find(w => w.id === windowId);
  }, [windowId]);

  const isIframe = window.self !== window.top;

  const sendMessage = useCallback((type: string, payload?: any) => {
    if (isIframe && window.parent) {
      window.parent.postMessage({ type, windowId, payload }, '*');
    }
  }, [isIframe, windowId]);

  return {
    id: windowId,
    setTitle: useCallback((title: string) => {
      if (isIframe) {
        sendMessage('WINDOW_API_SET_TITLE', { title });
      } else {
        updateWindowTitle(windowId, title);
      }
    }, [isIframe, sendMessage, windowId, updateWindowTitle]),
    
    resizeTo: useCallback((width: number, height: number) => {
      if (isIframe) {
        sendMessage('WINDOW_API_RESIZE_TO', { width, height });
      } else {
        updateSize(windowId, { width, height });
      }
    }, [isIframe, sendMessage, windowId, updateSize]),
    
    requestAttention: useCallback(() => {
      if (isIframe) {
        sendMessage('WINDOW_API_REQUEST_ATTENTION');
      } else {
        focusWindow(windowId);
      }
    }, [isIframe, sendMessage, windowId, focusWindow]),
    
    updateState: useCallback((newState: unknown) => {
      if (isIframe) {
        // AppState is kept locally in the iframe's React instance, but we can also sync it up if needed.
        // For isolated apps, we only sync it if the OS shell needs it.
        sendMessage('WINDOW_API_UPDATE_STATE', { newState });
      } else {
        updateAppState(windowId, newState);
      }
    }, [isIframe, sendMessage, windowId, updateAppState]),

    getState: useCallback(<T>() => {
      const win = getWindow();
      return win?.appState as T | undefined;
    }, [getWindow])
  };
}
