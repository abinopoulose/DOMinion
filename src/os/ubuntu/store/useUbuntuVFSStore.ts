import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NodeMap, VFSNodeType, VFSNode } from '../fs/types';
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
import { ROOT_ID, ROOT_HOME_ID, seedNodeMap, seedUserHome, getHomeId, getDesktopId, getTrashId } from '../fs/seed';
import { UBUNTU_ACCOUNTS } from '../../../config/accounts';
import { useUbuntuAuthStore } from './useUbuntuAuthStore';
import { hasPermission } from '../fs/permissions';

let tempExecutionUser: string | null = null;

export function setTempExecutionUser(user: string | null) {
  tempExecutionUser = user;
}

export function getAuthContext() {
  if (tempExecutionUser) {
    return { username: tempExecutionUser, role: 'admin' };
  }
  const username = useUbuntuAuthStore.getState().currentUser || 'user';
  const role = UBUNTU_ACCOUNTS.find(u => u.username === username)?.role || 'standard';
  return { username, role };
}

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
  createNode: (parentId: string, name: string, type: VFSNodeType, content?: string, executionUser?: string) => { id?: string; error?: string };
  deleteNode: (id: string, executionUser?: string) => string | undefined;
  renameNode: (id: string, newName: string, executionUser?: string) => string | undefined;
  moveNode: (id: string, newParentId: string, executionUser?: string) => string | undefined;
  duplicateNode: (id: string, newParentId: string, executionUser?: string) => { id?: string; error?: string };
  updateContent: (id: string, content: string, executionUser?: string) => string | undefined;
  updatePermissions: (id: string, permissions: string, executionUser?: string) => string | undefined;
  updateOwner: (id: string, owner?: string, group?: string, executionUser?: string) => string | undefined;
  moveToTrash: (id: string, executionUser?: string) => string | undefined;
  restoreFromTrash: (id: string, executionUser?: string) => string | undefined;

  // Queries
  getNode: (id: string, executionUser?: string) => VFSNode | null;
  getChildren: (id: string, executionUser?: string) => VFSNode[];
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

      createNode: (parentId, name, type, content, executionUser) => {
        let error: string | undefined;
        let id: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, parentId, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
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

      deleteNode: (id, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = deleteNodeOp(state.map, id);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      renameNode: (id, newName, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = renameNodeOp(state.map, id, newName);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      moveNode: (id, newParentId, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user) || !hasPermission(state.map, newParentId, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = moveNodeOp(state.map, id, newParentId);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      duplicateNode: (id, newParentId, executionUser) => {
        let error: string | undefined;
        let newId: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'read', user) || !hasPermission(state.map, newParentId, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
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

      updateContent: (id, content, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = updateContentOp(state.map, id, content);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      updatePermissions: (id, permissions, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = updatePermissionsOp(state.map, id, permissions);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      updateOwner: (id, owner, group, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const result = updateOwnerOp(state.map, id, owner, group);
          if (result.error) {
            error = result.error;
            return state;
          }
          return { map: result.newMap };
        });
        return error;
      },

      moveToTrash: (id, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const HOME_ID = getHomeId(user);
          const TRASH_ID = getTrashId(user);

          const protectedIds = [ROOT_ID, ROOT_HOME_ID];
          UBUNTU_ACCOUNTS.forEach(acc => {
            protectedIds.push(getHomeId(acc.username), getDesktopId(acc.username), getTrashId(acc.username));
          });

          if (protectedIds.includes(id)) {
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

      restoreFromTrash: (id, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, id, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const HOME_ID = getHomeId(user);
          const TRASH_ID = getTrashId(user);

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

      getNode: (id, executionUser) => {
        const user = executionUser || getAuthContext().username;
        if (!hasPermission(get().map, id, 'read', user)) return null;
        return getNode(get().map, id);
      },
      getChildren: (id, executionUser) => {
        const user = executionUser || getAuthContext().username;
        if (!hasPermission(get().map, id, 'read', user)) return [];
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
        
        // Ensure system directories exist for migration
        const rootNode = migratedMap[ROOT_ID];
        if (rootNode) {
          const checkAndCreateSystemDir = (name: string, overrideId?: string) => {
            let existingChild = rootNode.children.find(childId => migratedMap[childId]?.name === name);
            if (!existingChild && overrideId && migratedMap[overrideId]) {
               // The node exists but isn't linked to root, link it
               existingChild = overrideId;
               if (!rootNode.children.includes(overrideId)) {
                 rootNode.children.push(overrideId);
               }
            }
            if (!existingChild && !migratedMap[overrideId || '']) {
              const id = overrideId || crypto.randomUUID();
              migratedMap[id] = {
                id, name, type: 'directory', parentId: ROOT_ID, children: [], content: '',
                createdAt: Date.now(), modifiedAt: Date.now(), owner: 'root', group: 'root', permissions: '755', meta: { extension: '' }
              };
              if (!rootNode.children.includes(id)) {
                rootNode.children.push(id);
              }
            }
          };
          checkAndCreateSystemDir('home', ROOT_HOME_ID);
          checkAndCreateSystemDir('etc');
          checkAndCreateSystemDir('bin');
          checkAndCreateSystemDir('usr');
        }

        // Ensure all registered users have a home directory (migration/seeding for new users)
        UBUNTU_ACCOUNTS.forEach(acc => {
          seedUserHome(migratedMap, acc.username);
          // Enforce strict 750 permissions on home directories so other users cannot access them
          const homeId = getHomeId(acc.username);
          if (migratedMap[homeId]) {
            migratedMap[homeId].permissions = '750';
          }
        });

        return { ...currentState, ...persistedState, map: migratedMap };
      },
    }
  )
);
