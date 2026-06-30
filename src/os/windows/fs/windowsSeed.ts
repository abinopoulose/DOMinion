import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, VFSNode } from './types';

export const WINDOWS_ROOT_ID = 'windows-root';

export function seedWindowsNodeMap(): NodeMap {
  const map: NodeMap = {};
  const now = Date.now();

  const addNode = (node: VFSNode) => {
    map[node.id] = node;
  };

  // C:\ Drive
  addNode({
    id: WINDOWS_ROOT_ID,
    parentId: null,
    name: 'C:',
    type: 'directory',
    content: '',
    children: [],
    createdAt: now,
    modifiedAt: now,
    owner: 'system',
    group: 'system',
    permissions: '755',
    meta: {},
  });

  const usersId = uuidv4();
  addNode({
    id: usersId,
    parentId: WINDOWS_ROOT_ID,
    name: 'Users',
    type: 'directory',
    content: '',
    children: [],
    createdAt: now,
    modifiedAt: now,
    owner: 'system',
    group: 'system',
    permissions: '755',
    meta: {},
  });

  const abinoId = uuidv4();
  addNode({
    id: abinoId,
    parentId: usersId,
    name: 'abinopoulose',
    type: 'directory',
    content: '',
    children: [],
    createdAt: now,
    modifiedAt: now,
    owner: 'abinopoulose',
    group: 'abinopoulose',
    permissions: '755',
    meta: {},
  });

  const desktopId = uuidv4();
  addNode({
    id: desktopId,
    parentId: abinoId,
    name: 'Desktop',
    type: 'directory',
    content: '',
    children: [],
    createdAt: now,
    modifiedAt: now,
    owner: 'abinopoulose',
    group: 'abinopoulose',
    permissions: '755',
    meta: {},
  });

  const docsId = uuidv4();
  addNode({
    id: docsId,
    parentId: abinoId,
    name: 'Documents',
    type: 'directory',
    content: '',
    children: [],
    createdAt: now,
    modifiedAt: now,
    owner: 'abinopoulose',
    group: 'abinopoulose',
    permissions: '755',
    meta: {},
  });

  return map;
}
