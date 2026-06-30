import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NodeMap, VFSNodeType, VFSNode } from '../fs/types';
import { seedWindowsNodeMap, WINDOWS_ROOT_ID } from '../fs/windowsSeed';
import { windowsIdbStorage } from './persistence';
import {
  createNode as createNodeOp,
  deleteNode as deleteNodeOp,
  renameNode as renameNodeOp,
  moveNode as moveNodeOp,
  updateContent as updateContentOp,
  updatePermissions as updatePermissionsOp,
  updateOwner as updateOwnerOp,
  getNode,
  getChildren,
  getParent,
  exists,
  duplicateNode as duplicateNodeOp,
} from '../fs/operations';
import { resolvePath, getAbsolutePath, resolveRelativePath } from '../fs/pathResolver';

export interface ClipboardState {
  action: 'cut' | 'copy' | null;
  nodeId: string | null;
}

interface WindowsVFSStore {
  map: NodeMap;
  clipboard: ClipboardState;
  
  // Clipboard
  setClipboard: (action: 'cut' | 'copy' | null, nodeId: string | null) => void;

  // Mutations (return error string if failed, undefined if success)
  createNode: (parentId: string, name: string, type: VFSNodeType, content?: string) => { id?: string; error?: string };
  deleteNode: (id: string) => string | undefined;
  renameNode: (id: string, newName: string) => string | undefined;
  moveNode: (id: string, newParentId: string) => string | undefined;
  duplicateNode: (id: string, newParentId: string) => { id?: string; error?: string };
  updateContent: (id: string, content: string) => string | undefined;
  updatePermissions: (id: string, permissions: string) => string | undefined;
  updateOwner: (id: string, owner?: string, group?: string) => string | undefined;

  // Queries
  getNode: (id: string) => VFSNode | null;
  getChildren: (id: string) => VFSNode[];
  getParent: (id: string) => VFSNode | null;
  resolvePath: (absolutePath: string) => VFSNode | null;
  getAbsolutePath: (id: string) => string;
  resolveRelativePath: (cwdId: string, path: string) => VFSNode | null;
  exists: (parentId: string, name: string) => boolean;
}

export const useWindowsVFSStore = create<WindowsVFSStore>()(
  persist(
    (set, get) => ({
      map: {},
      clipboard: { action: null, nodeId: null },

      setClipboard: (action, nodeId) => set({ clipboard: { action, nodeId } }),

      createNode: (parentId, name, type, content) => {
        let error: string | undefined;
        let id: string | undefined;
        set((state) => {
          const result = createNodeOp(state.map, parentId, name, type, content);
          if (result.error) {
            error = result.error;
            return state;
          }
          id = result.node.id;
          return { map: result.newMap };
        });
        return { id, error };
      },

      deleteNode: (id) => {
        let error: string | undefined;
        set((state) => {
          const result = deleteNodeOp(state.map, id);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      renameNode: (id, newName) => {
        let error: string | undefined;
        set((state) => {
          const result = renameNodeOp(state.map, id, newName);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      moveNode: (id, newParentId) => {
        let error: string | undefined;
        set((state) => {
          const result = moveNodeOp(state.map, id, newParentId);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      duplicateNode: (id, newParentId) => {
        let error: string | undefined;
        let newId: string | undefined;
        set((state) => {
          const result = duplicateNodeOp(state.map, id, newParentId);
          if (result.error) {
            error = result.error;
            return state;
          }
          newId = result.newId;
          return { map: result.newMap };
        });
        return { id: newId, error };
      },

      updateContent: (id, content) => {
        let error: string | undefined;
        set((state) => {
          const result = updateContentOp(state.map, id, content);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      updatePermissions: (id, permissions) => {
        let error: string | undefined;
        set((state) => {
          const result = updatePermissionsOp(state.map, id, permissions);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      updateOwner: (id, owner, group) => {
        let error: string | undefined;
        set((state) => {
          const result = updateOwnerOp(state.map, id, owner, group);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      getNode: (id) => getNode(get().map, id),
      getChildren: (id) => {
        const children = getChildren(get().map, id);
        return children.sort((a: VFSNode, b: VFSNode) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
      },
      getParent: (id) => getParent(get().map, id),
      resolvePath: (path) => resolvePath(get().map, WINDOWS_ROOT_ID, path),
      getAbsolutePath: (id) => getAbsolutePath(get().map, id),
      resolveRelativePath: (cwdId, path) => resolveRelativePath(get().map, cwdId, path, WINDOWS_ROOT_ID),
      exists: (parentId, name) => exists(get().map, parentId, name),
    }),
    {
      name: 'windows-vfs',
      storage: createJSONStorage(() => windowsIdbStorage),
      merge: (persistedState: any, currentState) => {
        if (!persistedState || !persistedState.map || Object.keys(persistedState.map).length === 0) {
          return { ...currentState, map: seedWindowsNodeMap() };
        }
        return { ...currentState, ...persistedState, map: { ...persistedState.map } };
      },
    }
  )
);
