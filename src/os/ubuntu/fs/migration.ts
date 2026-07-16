import { keys, get, del } from 'idb-keyval';
import { getDB } from './db';
import type { LegacyVFSNode, VFSNode } from './types';

/**
 * Migrates any remaining legacy vfs_node_* keys from idb-keyval into the new ubuntu-vfs DB.
 * This is only needed for users who have leftover data from the old architecture.
 * Fresh installs are handled entirely by seedVfsFromSnapshot().
 */
export async function migrateVFS() {
  console.log('[VFS Migration] Checking for leftover legacy nodes...');
  
  const allKeys = await keys();
  const vfsKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('vfs_node_'));

  if (vfsKeys.length === 0) {
    console.log('[VFS Migration] No legacy vfs_node_* keys found. Nothing to migrate.');
    return;
  }

  console.log(`[VFS Migration] Found ${vfsKeys.length} legacy keys. Migrating...`);
  const db = await getDB();

  const BATCH_SIZE = 500;
  let migrated = 0;

  for (let i = 0; i < vfsKeys.length; i += BATCH_SIZE) {
    const batchKeys = vfsKeys.slice(i, i + BATCH_SIZE);

    // Fetch all legacy nodes for this batch
    const batchNodes: { key: IDBValidKey; node: LegacyVFSNode }[] = [];
    for (const key of batchKeys) {
      const legacyNode = await get<LegacyVFSNode>(key);
      if (legacyNode) {
        batchNodes.push({ key, node: legacyNode });
      }
    }

    // Write batch into new DB
    const tx = db.transaction(['inodes', 'file_data'], 'readwrite');
    const inodesStore = tx.objectStore('inodes');
    const fileDataStore = tx.objectStore('file_data');

    for (const { node: legacy } of batchNodes) {
      try {
        const permissions = typeof legacy.permissions === 'string'
          ? parseInt(legacy.permissions, 8)
          : 0o755;
        const hasBinaryContent = legacy.type === 'file' && !!legacy.content;

        const newNode: VFSNode = {
          id: legacy.id,
          name: legacy.name,
          type: legacy.type,
          parentId: legacy.parentId,
          permissions,
          ownerId: legacy.owner || 'user',
          groupId: legacy.group || 'user',
          createdAt: legacy.createdAt || Date.now(),
          modifiedAt: legacy.modifiedAt || Date.now(),
          accessedAt: legacy.modifiedAt || Date.now(),
          sizeBytes: hasBinaryContent ? legacy.content.length : 0,
          hasBinaryContent,
          meta: legacy.meta || {},
        };

        if (hasBinaryContent) {
          const blob = new Blob([legacy.content], { type: newNode.meta?.mimeType || 'text/plain' });
          newNode.sizeBytes = blob.size;
          fileDataStore.put(blob, newNode.id);
        }

        inodesStore.put(newNode);
      } catch (_) {
        // Skip individual errors
      }
    }

    await tx.done;

    // Delete migrated legacy keys
    for (const { key } of batchNodes) {
      try { await del(key); } catch (_) {}
    }

    migrated += batchNodes.length;

    // Yield to event loop
    if (i + BATCH_SIZE < vfsKeys.length) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Also clean up the old seeded flag
  try { await del('vfs_seeded_v3'); } catch (_) {}

  console.log(`[VFS Migration] ✅ Migrated ${migrated} legacy nodes. Cleanup complete.`);
}
