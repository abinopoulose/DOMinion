import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NodeMap, VFSNodeType, VFSNode } from '../fs/types';
import { seedNodeMap } from '../fs/seed';
import { ubuntuIdbStorage } from './persistence';
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
import { ROOT_ID, HOME_ID, DESKTOP_ID, TRASH_ID } from '../fs/seed';

export interface ClipboardState {
  action: 'cut' | 'copy' | null;
  nodeId: string | null;
}

interface VFSStore {
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
  moveToTrash: (id: string) => string | undefined;
  restoreFromTrash: (id: string) => string | undefined;

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

      moveToTrash: (id) => {
        let error: string | undefined;
        set((state) => {
          if (id === ROOT_ID || id === HOME_ID || id === DESKTOP_ID || id === TRASH_ID) {
            error = 'Cannot move system directory to trash';
            return state;
          }
          const node = state.map[id];
          if (!node) return state;
          
          let newMap = { ...state.map };
          newMap[id] = { ...node, meta: { ...node.meta, originalParentId: node.parentId || HOME_ID } };
          
          newMap = moveNodeOp(newMap, id, TRASH_ID).newMap;
          
          const getTrashSize = (map: NodeMap) => {
            const getDirSize = (nodeId: string): number => {
              const n = map[nodeId];
              if (!n) return 0;
              if (n.type === 'file') return new Blob([n.content || '']).size;
              return n.children.reduce((acc, childId) => acc + getDirSize(childId), 4096);
            };
            return getDirSize(TRASH_ID);
          };

          const MAX_TRASH_SIZE = 1024 * 1024 * 1024; // 1 GB
          
          let trashSize = getTrashSize(newMap);
          if (trashSize > MAX_TRASH_SIZE) {
            const trashNode = newMap[TRASH_ID];
            if (trashNode) {
              const items = [...trashNode.children].map(cId => newMap[cId]).sort((a, b) => a.modifiedAt - b.modifiedAt);
              for (const item of items) {
                if (trashSize <= MAX_TRASH_SIZE) break;
                newMap = deleteNodeOp(newMap, item.id).newMap;
                trashSize = getTrashSize(newMap);
              }
            }
          }
          return { map: newMap };
        });
        return error;
      },

      restoreFromTrash: (id) => {
        let error: string | undefined;
        set((state) => {
          const node = state.map[id];
          if (!node) {
            error = 'Node not found';
            return state;
          }
          if (node.parentId !== TRASH_ID) {
            error = 'Node is not in trash';
            return state;
          }
          
          let targetParentId = node.meta?.originalParentId || HOME_ID;
          if (!state.map[targetParentId]) {
            targetParentId = HOME_ID;
          }
          
          let newMap = moveNodeOp(state.map, id, targetParentId).newMap;
          
          const restoredNode = newMap[id];
          if (restoredNode && restoredNode.meta) {
            newMap[id] = {
              ...restoredNode,
              meta: { ...restoredNode.meta, originalParentId: undefined }
            };
          }
          
          return { map: newMap };
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
      storage: createJSONStorage(() => ubuntuIdbStorage),
      merge: (persistedState: any, currentState) => {
        // If there's no persisted state or map is empty, seed it
        if (!persistedState || !persistedState.map || Object.keys(persistedState.map).length === 0) {
          return { ...currentState, map: seedNodeMap() };
        }
        const migratedMap = { ...persistedState.map };
        
        // Migration: add missing permissions, owner, group, and meta to existing nodes
        for (const id in migratedMap) {
          const node = migratedMap[id];
          if (!node.owner) node.owner = 'user';
          if (!node.group) node.group = 'user';
          if (!node.permissions) node.permissions = node.type === 'directory' ? '755' : '644';
          if (!node.meta) {
            let extension = '';
            if (node.type === 'file' && node.name.includes('.')) {
              extension = node.name.split('.').pop() || '';
            }
            node.meta = { extension };
          }
        }
        
        // Ensure trash exists
        if (!migratedMap[TRASH_ID]) {
          migratedMap[TRASH_ID] = {
            id: TRASH_ID,
            name: '.Trash',
            type: 'directory',
            parentId: HOME_ID,
            children: [],
            content: '',
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            owner: 'user',
            group: 'user',
            permissions: '755',
            meta: {}
          };
          if (migratedMap[HOME_ID] && !migratedMap[HOME_ID].children.includes(TRASH_ID)) {
            migratedMap[HOME_ID].children.push(TRASH_ID);
          }
        }

        return { ...currentState, ...persistedState, map: migratedMap };
      },
    }
  )
);
