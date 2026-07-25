import { describe, it, expect } from 'vitest';
import type { VFSNode } from '../../../../src/os/ubuntu/fs/types';

describe('VFS Types', () => {
  it('can create a node matching VFSNode interface', () => {
    const node: VFSNode = {
      id: '1',
      name: 'test',
      type: 'file',
      parentId: null,
      permissions: 0o755,
      ownerId: 'root',
      groupId: 'root',
      createdAt: 100,
      modifiedAt: 100,
      accessedAt: 100,
      sizeBytes: 10,
      hasBinaryContent: true
    };
    expect(node).toBeDefined();
  });
});
