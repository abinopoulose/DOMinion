import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NodeMap, VFSNodeType, VFSNode } from '../core/vfs/types';
import { seedNodeMap } from '../core/vfs/seed';
import { idbStorage } from '../core/persistence';
import {
  createNode as createNodeOp,
  deleteNode as deleteNodeOp,
  renameNode as renameNodeOp,
  moveNode as moveNodeOp,
  updateContent as updateContentOp,
  getNode,
  getChildren,
  getParent,
  exists,
} from '../core/vfs/operations';
import { resolvePath, getAbsolutePath, resolveRelativePath } from '../core/vfs/pathResolver';
import { ROOT_ID } from '../core/vfs/seed';

interface VFSStore {
  map: NodeMap;
  
  // Mutations (return error string if failed, undefined if success)
  createNode: (parentId: string, name: string, type: VFSNodeType, content?: string) => string | undefined;
  deleteNode: (id: string) => string | undefined;
  renameNode: (id: string, newName: string) => string | undefined;
  moveNode: (id: string, newParentId: string) => string | undefined;
  updateContent: (id: string, content: string) => string | undefined;

  // Queries
  getNode: (id: string) => VFSNode | null;
  getChildren: (id: string) => VFSNode[];
  getParent: (id: string) => VFSNode | null;
  resolvePath: (absolutePath: string) => VFSNode | null;
  getAbsolutePath: (id: string) => string;
  resolveRelativePath: (cwdId: string, path: string) => VFSNode | null;
  exists: (parentId: string, name: string) => boolean;
}

export const useVFSStore = create<VFSStore>()(
  persist(
    (set, get) => ({
      map: {},

      createNode: (parentId, name, type, content) => {
        let error: string | undefined;
        set((state) => {
          const result = createNodeOp(state.map, parentId, name, type, content);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
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

      getNode: (id) => getNode(get().map, id),
      getChildren: (id) => {
        const children = getChildren(get().map, id);
        // Sort: directories first, then alphabetically
        return children.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
      },
      getParent: (id) => getParent(get().map, id),
      resolvePath: (path) => resolvePath(get().map, ROOT_ID, path),
      getAbsolutePath: (id) => getAbsolutePath(get().map, id),
      resolveRelativePath: (cwdId, path) => resolveRelativePath(get().map, cwdId, path, ROOT_ID),
      exists: (parentId, name) => exists(get().map, parentId, name),
    }),
    {
      name: 'ubuntu-vfs',
      storage: createJSONStorage(() => idbStorage),
      merge: (persistedState: any, currentState) => {
        // If there's no persisted state or map is empty, seed it
        if (!persistedState || !persistedState.map || Object.keys(persistedState.map).length === 0) {
          return { ...currentState, map: seedNodeMap() };
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
);
