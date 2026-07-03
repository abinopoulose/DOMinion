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
import { type InodeTable } from '../fs/inode';
import { nodeMapToInodeTable, buildCompatNodeMap } from '../fs/inodeCompat';
import * as inodeOps from '../fs/inodeOperations';
import { ROOT_ID, ROOT_HOME_ID, seedNodeMap, seedUserHome, getHomeId, getDesktopId, getTrashId } from '../fs/seed';
import { UBUNTU_ACCOUNTS } from '../../../config/accounts';
import { useUbuntuAuthStore } from './useUbuntuAuthStore';
import { hasPermission } from '../fs/permissions';

function canDeleteOrRename(map: NodeMap, nodeId: string, user: string): boolean {
  if (user === 'root') return true;
  const node = map[nodeId];
  if (!node) return false;
  const parentId = node.parentId;
  if (!parentId) return false;
  
  if (!hasPermission(map, parentId, 'write', user)) return false;

  const parent = map[parentId];
  const parentMode = parseInt(parent.permissions || (parent.type === 'directory' ? '755' : '644'), 8);
  if ((parentMode & 0o1000) !== 0) {
    if (node.owner !== user && parent.owner !== user) return false;
  }
  return true;
}
import {
  generatePasswdContent,
  generateShadowContent,
  generateSudoersContent,
  generateGroupContent,
} from '../fs/authSeed';

let tempExecutionUser: string | null = null;

/**
 * INTERNAL ONLY. Sets a temporary execution user for VFS operations.
 * Use `withElevation()` from SudoService instead of calling this directly.
 */
export function setTempExecutionUser(user: string | null) {
  tempExecutionUser = user;
}

export function getAuthContext() {
  if (tempExecutionUser) {
    return { username: tempExecutionUser, role: 'admin' };
  }
  const username = useUbuntuAuthStore.getState().currentUser || 'peasant';
  const role = UBUNTU_ACCOUNTS.find(u => u.username === username)?.role || 'standard';
  return { username, role };
}

export interface ClipboardState {
  action: 'cut' | 'copy' | null;
  nodeId: string | null;
}

interface VFSStore {
  map: NodeMap;
  inodeTable: InodeTable;
  rootIno: number;
  nextIno: number;
  idToIno: Record<string, number>;
  inoToId: Record<number, string>;
  clipboard: ClipboardState;
  
  // Clipboard
  setClipboard: (action: 'cut' | 'copy' | null, nodeId: string | null) => void;

  // Mutations (return error string if failed, undefined if success)
  createNode: (parentId: string, name: string, type: VFSNodeType, content?: string, executionUser?: string) => { id?: string; error?: string };
  createLink: (parentId: string, name: string, targetId: string, executionUser?: string) => { error?: string };
  createSymlink: (parentId: string, name: string, targetPath: string, executionUser?: string) => { id?: string; error?: string };
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
      inodeTable: {},
      rootIno: 2,
      nextIno: 3,
      idToIno: {},
      inoToId: {},
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
          const result = createNodeOp(state.map, parentId, name, type, content, user, user);
          if (result.error) {
            error = result.error;
            return state;
          }
          id = result.node.id;
          return { map: result.newMap };
        });
        return { id, error };
      },

      createLink: (parentId, name, targetId, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, parentId, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const parentIno = state.idToIno[parentId];
          const targetIno = state.idToIno[targetId];
          if (!parentIno || !targetIno) {
            error = 'Node not found';
            return state;
          }
          const result = inodeOps.linkInode(state.inodeTable, parentIno, name, targetIno);
          if (result.error) {
            error = result.error;
            return state;
          }
          const newMap = buildCompatNodeMap(result.newTable, state.rootIno, state.inoToId);
          return { inodeTable: result.newTable, map: newMap };
        });
        return { error };
      },

      createSymlink: (parentId, name, targetPath, executionUser) => {
        let error: string | undefined;
        let id: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!hasPermission(state.map, parentId, 'write', user)) {
            error = 'Permission denied';
            return state;
          }
          const parentIno = state.idToIno[parentId];
          if (!parentIno) {
            error = 'Parent not found';
            return state;
          }
          const uid = user === 'root' ? 0 : 1000;
          const gid = user === 'root' ? 0 : 1000;
          const result = inodeOps.symlinkInode(state.inodeTable, state.nextIno, parentIno, name, targetPath, uid, gid);
          if (result.error) {
            error = result.error;
            return state;
          }
          const newIdToIno = { ...state.idToIno };
          const newInoToId = { ...state.inoToId };
          const newId = result.ino.toString();
          newIdToIno[newId] = result.ino;
          newInoToId[result.ino] = newId;
          id = newId;

          const newMap = buildCompatNodeMap(result.newTable, state.rootIno, newInoToId);
          return { inodeTable: result.newTable, nextIno: result.nextIno, map: newMap, idToIno: newIdToIno, inoToId: newInoToId };
        });
        return { id, error };
      },

      deleteNode: (id, executionUser) => {
        let error: string | undefined;
        set((state) => {
          const user = executionUser || getAuthContext().username;
          if (!canDeleteOrRename(state.map, id, user)) {
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
          if (!canDeleteOrRename(state.map, id, user)) {
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
          if (!canDeleteOrRename(state.map, id, user) || !hasPermission(state.map, newParentId, 'write', user)) {
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
          if (!canDeleteOrRename(state.map, id, user)) {
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
      partialize: (state) => {
        const map = { ...state.map };
        
        // Find system directories we don't want to persist
        const rootNode = map['root'];
        if (rootNode) {
          const volatileDirs = ['tmp', 'proc', 'dev'];
          const volatileIds = new Set<string>();
          
          rootNode.children.forEach(childId => {
            const childNode = map[childId];
            if (childNode && volatileDirs.includes(childNode.name)) {
              volatileIds.add(childId);
              
              // We want to keep the directory itself, but not its children.
              // So we just clear the children array for persistence.
              map[childId] = { ...childNode, children: [] };
            }
          });
          
          // Helper to recursively find all children of volatile dirs
          const removeChildren = (id: string) => {
            const node = state.map[id];
            if (node && node.children) {
              node.children.forEach(cId => {
                delete map[cId];
                removeChildren(cId);
              });
            }
          };
          
          volatileIds.forEach(id => removeChildren(id));
        }
        
        return { ...state, map };
      },
      merge: (persistedState: any, currentState) => {
        // If there's no persisted state or map is empty, seed it
        if (!persistedState || !persistedState.map || Object.keys(persistedState.map).length === 0) {
          return { ...currentState, map: seedNodeMap() };
        }
        const migratedMap = { ...persistedState.map };
        
        // Migration: add missing permissions, owner, group, and meta to existing nodes
        for (const id in migratedMap) {
          const node = migratedMap[id];
          if (!node.owner) node.owner = 'peasant';
          if (!node.group) node.group = 'peasant';
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
            let existingChild = rootNode.children.find((childId: string) => migratedMap[childId]?.name === name);
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

        // Ensure auth files exist in /etc (migration for existing VFS)
        const etcNode = Object.values(migratedMap).find(
          (n: any) => n.name === 'etc' && n.parentId === ROOT_ID
        ) as VFSNode | undefined;
        if (etcNode) {
          const ensureEtcFile = (name: string, content: string, permissions: string, group?: string) => {
            const fileExists = etcNode.children.some((cId: string) => migratedMap[cId]?.name === name);
            if (!fileExists) {
              const id = crypto.randomUUID();
              migratedMap[id] = {
                id, name, type: 'file', parentId: etcNode.id, children: [], content,
                createdAt: Date.now(), modifiedAt: Date.now(),
                owner: 'root', group: group || 'root', permissions,
                meta: { extension: '' }
              };
              etcNode.children.push(id);
            }
          };

          ensureEtcFile('passwd', generatePasswdContent(), '644');
          ensureEtcFile('shadow', generateShadowContent(), '640', 'shadow');
          ensureEtcFile('sudoers', generateSudoersContent(), '440');
          ensureEtcFile('group', generateGroupContent(), '644');
        }

        // Find the actual /home directory ID in the graph
        let actualHomeId = ROOT_HOME_ID;
        const homeNode = Object.values(migratedMap).find((n: any) => n.name === 'home' && n.parentId === ROOT_ID);
        if (homeNode) {
          actualHomeId = (homeNode as any).id;
        }

        // Ensure all registered users have a home directory (migration/seeding for new users)
        UBUNTU_ACCOUNTS.forEach(acc => {
          seedUserHome(migratedMap, acc.username, actualHomeId);
          // Enforce strict 750 permissions on home directories so other users cannot access them
          const homeId = getHomeId(acc.username);
          if (migratedMap[homeId]) {
            migratedMap[homeId].permissions = '750';
            migratedMap[homeId].owner = acc.username;
            migratedMap[homeId].group = acc.username;
            
            // Fix ownership for children recursively due to previous bad migration
            const updateChildren = (parentId: string) => {
              const pNode = migratedMap[parentId];
              if (pNode && pNode.children) {
                pNode.children.forEach(cId => {
                  const cNode = migratedMap[cId];
                  if (cNode) {
                    if (cNode.owner === 'peasant' || cNode.owner === 'root' || !cNode.owner) {
                      cNode.owner = acc.username;
                      cNode.group = acc.username;
                    }
                    updateChildren(cId);
                  }
                });
              }
            };
            updateChildren(homeId);
          }
        });

        const { table, rootIno, nextIno, idToIno, inoToId } = nodeMapToInodeTable(migratedMap, ROOT_ID);

        return { ...currentState, ...persistedState, map: migratedMap, inodeTable: table, rootIno, nextIno, idToIno, inoToId };
      },
    }
  )
);

export const useUbuntuVFSStore = useVFSStore;
