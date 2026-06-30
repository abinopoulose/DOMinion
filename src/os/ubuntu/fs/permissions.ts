import type { NodeMap } from './types';

export function hasPermission(
  map: NodeMap,
  nodeId: string,
  operationType: 'read' | 'write' | 'execute',
  executionUser: string,
  _role?: string
): boolean {
  if (executionUser === 'root') return true;
  
  const node = map[nodeId];
  if (!node) return false;

  const perms = node.permissions;
  if (!perms || perms.length !== 3) return false;

  let permChar = perms[2]; // other
  if (executionUser === node.owner) {
    permChar = perms[0]; // owner
  } else if (executionUser === node.group) {
    permChar = perms[1]; // group
  }

  const permNum = parseInt(permChar, 8);
  if (isNaN(permNum)) return false;

  if (operationType === 'read' && (permNum & 4)) return true;
  if (operationType === 'write' && (permNum & 2)) return true;
  if (operationType === 'execute' && (permNum & 1)) return true;

  return false;
}
