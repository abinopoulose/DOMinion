import { get, setMany } from 'idb-keyval';
import type { VFSNode } from './types';

// Browser-side parser that seeds IDB
export async function seedVfsFromSnapshot() {
  const isSeeded = await get('vfs_seeded_v2');
  if (isSeeded) return;

  try {
    const res = await fetch('/ubuntu/vfs_seed.json');
    if (!res.ok) return;
    const nodes: VFSNode[] = await res.json();

    // Save to IDB in chunks
    for (let i = 0; i < nodes.length; i += 1000) {
      const chunk = nodes.slice(i, i + 1000);
      await setMany(chunk.map(n => [`vfs_node_${n.id}`, n]));
    }
    
    await setMany([['vfs_seeded_v2', true]]);
  } catch (err) {
    console.error('Failed to seed VFS:', err);
  }
}
