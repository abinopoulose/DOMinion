export type FSEventType = 'fs:changed' | 'fs:created' | 'fs:deleted';

export type FSEventHandler = (path: string, type: FSEventType) => void;

class FSEvents {
  private listeners: Map<string, Set<FSEventHandler>> = new Map();
  private globalListeners: Set<FSEventHandler> = new Set();

  subscribe(path: string, handler: FSEventHandler) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(handler);
    return () => {
      this.listeners.get(path)?.delete(handler);
    };
  }

  subscribeGlobal(handler: FSEventHandler) {
    this.globalListeners.add(handler);
    return () => {
      this.globalListeners.delete(handler);
    };
  }

  emit(path: string, type: FSEventType) {
    // Notify exact path listeners
    if (this.listeners.has(path)) {
      for (const handler of this.listeners.get(path)!) {
        handler(path, type);
      }
    }
    
    // Notify parent directory listeners
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      segments.pop();
      const parentPath = '/' + segments.join('/');
      if (this.listeners.has(parentPath)) {
        for (const handler of this.listeners.get(parentPath)!) {
          handler(path, type);
        }
      }
    }

    // Global
    for (const handler of this.globalListeners) {
      handler(path, type);
    }
  }
}

export const fsEvents = new FSEvents();
