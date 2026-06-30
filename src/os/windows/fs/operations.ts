import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, VFSNode, VFSNodeType } from './types';

export function getNode(map: NodeMap, id: string): VFSNode | null {
  return map[id] || null;
}

export function getChildren(map: NodeMap, id: string): VFSNode[] {
  const node = getNode(map, id);
  if (!node || node.type !== 'directory') return [];
  return node.children.map(childId => map[childId]).filter(Boolean);
}

export function getParent(map: NodeMap, id: string): VFSNode | null {
  const node = getNode(map, id);
  if (!node || !node.parentId) return null;
  return getNode(map, node.parentId);
}

export function exists(map: NodeMap, parentId: string, name: string): boolean {
  const children = getChildren(map, parentId);
  return children.some(child => child.name === name);
}

export function createNode(
  map: NodeMap,
  parentId: string,
  name: string,
  type: VFSNodeType,
  content: string = ''
): { newMap: NodeMap; node: VFSNode; error?: string } {
  const parent = getNode(map, parentId);
  if (!parent) return { newMap: map, node: null as any, error: 'Parent directory does not exist' };
  if (parent.type !== 'directory') return { newMap: map, node: null as any, error: 'Parent is not a directory' };
  if (exists(map, parentId, name)) return { newMap: map, node: null as any, error: 'File or directory already exists' };

  const id = uuidv4();
  const now = Date.now();
  
  let extension = '';
  if (type === 'file' && name.includes('.')) {
    extension = name.split('.').pop() || '';
  }

  const node: VFSNode = {
    id,
    name,
    type,
    parentId,
    children: [],
    content,
    createdAt: now,
    modifiedAt: now,
    owner: 'user',
    group: 'user',
    permissions: type === 'directory' ? '755' : '644',
    meta: {
      extension
    }
  };

  const newMap = {
    ...map,
    [id]: node,
    [parentId]: {
      ...parent,
      children: [...parent.children, id],
      modifiedAt: now
    }
  };

  return { newMap, node };
}

export function deleteNode(map: NodeMap, id: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  let newMap = { ...map };
  
  // Recursively delete children
  if (node.type === 'directory') {
    for (const childId of node.children) {
      newMap = deleteNode(newMap, childId).newMap;
    }
  }

  // Remove from parent
  if (node.parentId) {
    const parent = newMap[node.parentId];
    if (parent) {
      newMap[node.parentId] = {
        ...parent,
        children: parent.children.filter(childId => childId !== id),
        modifiedAt: Date.now()
      };
    }
  }

  delete newMap[id];
  return { newMap };
}

export function renameNode(map: NodeMap, id: string, newName: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!node.parentId) return { newMap: map, error: 'Cannot rename root node' };
  
  if (exists(map, node.parentId, newName)) {
    return { newMap: map, error: 'A file or directory with this name already exists' };
  }

  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        name: newName,
        modifiedAt: Date.now()
      }
    }
  };
}

export function moveNode(map: NodeMap, id: string, newParentId: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  const newParent = getNode(map, newParentId);
  
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!newParent) return { newMap: map, error: 'Target directory does not exist' };
  if (newParent.type !== 'directory') return { newMap: map, error: 'Target is not a directory' };
  if (!node.parentId) return { newMap: map, error: 'Cannot move root node' };
  if (node.parentId === newParentId) return { newMap: map };
  if (exists(map, newParentId, node.name)) return { newMap: map, error: 'A file or directory with this name already exists in the target' };

  // Prevent circular moves (moving a folder into its own child)
  let currentParentId: string | null = newParentId;
  while (currentParentId) {
    if (currentParentId === id) return { newMap: map, error: 'Cannot move a directory into itself or its children' };
    const p = getNode(map, currentParentId);
    currentParentId = p ? p.parentId : null;
  }

  const oldParent = getNode(map, node.parentId);
  if (!oldParent) return { newMap: map, error: 'Old parent does not exist' };

  const now = Date.now();

  return {
    newMap: {
      ...map,
      [node.parentId]: {
        ...oldParent,
        children: oldParent.children.filter(childId => childId !== id),
        modifiedAt: now
      },
      [newParentId]: {
        ...newParent,
        children: [...newParent.children, id],
        modifiedAt: now
      },
      [id]: {
        ...node,
        parentId: newParentId,
        modifiedAt: now
      }
    }
  };
}

export function updateContent(map: NodeMap, id: string, content: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (node.type !== 'file') return { newMap: map, error: 'Cannot update content of a directory' };

  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        content,
        modifiedAt: Date.now()
      }
    }
  };
}

export function updatePermissions(map: NodeMap, id: string, permissions: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        permissions,
        modifiedAt: Date.now()
      }
    }
  };
}

export function updateOwner(map: NodeMap, id: string, owner?: string, group?: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        owner: owner || node.owner,
        group: group || node.group,
        modifiedAt: Date.now()
      }
    }
  };
}

export function duplicateNode(map: NodeMap, id: string, newParentId: string): { newMap: NodeMap; newId?: string; error?: string } {
  const node = getNode(map, id);
  const newParent = getNode(map, newParentId);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!newParent) return { newMap: map, error: 'Target directory does not exist' };
  if (newParent.type !== 'directory') return { newMap: map, error: 'Target is not a directory' };
  
  // Prevent circular duplication (copying a folder into its own child)
  let currentParentId: string | null = newParentId;
  while (currentParentId) {
    if (currentParentId === id) return { newMap: map, error: 'Cannot copy a directory into itself or its children' };
    const p = getNode(map, currentParentId);
    currentParentId = p ? p.parentId : null;
  }

  // Generate unique name for the target directory
  let targetName = node.name;
  if (newParentId === node.parentId) {
    targetName = `${node.name} (copy)`;
    let i = 1;
    while (exists(map, newParentId, targetName)) {
      targetName = `${node.name} (copy ${i++})`;
    }
  } else {
    let i = 1;
    while (exists(map, newParentId, targetName)) {
      targetName = `${node.name} ${i++}`;
    }
  }

  let currentMap = { ...map };
  
  // Recursive function to deep copy a node
  function deepCopy(sourceId: string, destParentId: string, overriddenName?: string): string {
    const sourceNode = currentMap[sourceId];
    const newId = uuidv4();
    const now = Date.now();
    
    const copiedNode: VFSNode = {
      ...sourceNode,
      id: newId,
      name: overriddenName || sourceNode.name,
      parentId: destParentId,
      children: [], // will be populated
      createdAt: now,
      modifiedAt: now
    };
    
    currentMap[newId] = copiedNode;
    
    // add to parent
    const parent = currentMap[destParentId];
    currentMap[destParentId] = {
      ...parent,
      children: [...parent.children, newId],
      modifiedAt: now
    };
    
    if (sourceNode.type === 'directory') {
      for (const childId of sourceNode.children) {
        const copiedChildId = deepCopy(childId, newId);
        currentMap[newId].children.push(copiedChildId);
      }
    }
    
    return newId;
  }
  
  const newId = deepCopy(id, newParentId, targetName);
  return { newMap: currentMap, newId };
}
