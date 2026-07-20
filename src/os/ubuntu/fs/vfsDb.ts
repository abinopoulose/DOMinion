import { getDB } from './db';
import type { LegacyVFSNode, VFSNode } from './types';
import { primePathCache } from './pathResolver';

function legacyToVFSNode(legacy: LegacyVFSNode): VFSNode {
  const permissions = typeof legacy.permissions === 'string'
    ? parseInt(legacy.permissions, 8)
    : 0o755;
  const hasBinaryContent = legacy.type === 'file' && !!legacy.content;

  return {
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
}

/**
 * Seeds the VFS. Returns as soon as the base OS tree is ready (instant).
 * The full 26K-node snapshot from vfs_seed.json loads in the background.
 */
export async function seedVfsFromSnapshot() {
  const db = await getDB();

  // Check if fully seeded
  const isFullySeeded = localStorage.getItem('vfs_fully_seeded') === 'true';
  const rootExists = await db.get('inodes', 'root');
  
  if (isFullySeeded && rootExists) {
    console.log('[VFS Seed] Database already fully seeded. Skipping.');
    return;
  }

  if (!rootExists) {
    console.log('[VFS Seed] Root node missing. Seeding base OS tree...');

  // Seed base OS structure from seedNodeMap() — fast, ~38 nodes
  const { seedNodeMap } = await import('./seed');
  const baseMap = seedNodeMap();

  const baseTx = db.transaction(['inodes', 'file_data'], 'readwrite');
  for (const id in baseMap) {
    const vfsNode = legacyToVFSNode(baseMap[id]);
    baseTx.objectStore('inodes').put(vfsNode);
    if (baseMap[id].type === 'file' && baseMap[id].content) {
      const blob = new Blob([baseMap[id].content], { type: 'text/plain' });
      baseTx.objectStore('file_data').put(blob, vfsNode.id);
    }
  }
  await baseTx.done;
  }
  console.log(`[VFS Seed] ✅ Base OS tree ready. UI can boot now.`);

  // Pre-warm pathResolver cache for critical login paths so the
  // first password check doesn't trigger slow IDB traversals.
  primePathCache('/etc', 'sys-etc');
  primePathCache('/etc/shadow', 'sys-etc-shadow');
  primePathCache('/etc/passwd', 'sys-etc-passwd');

  // Fire-and-forget: seed Resume.pdf and the full 26K-node snapshot in the background.
  // These do NOT block the login screen from rendering.
  seedResumePdfInBackground(db);
  seedSnapshotInBackground();
}

/** Seeds Resume.pdf to user desktops without blocking boot */
async function seedResumePdfInBackground(db: Awaited<ReturnType<typeof getDB>>) {
  try {
    const resumeRes = await fetch('/Resume.pdf');
    if (resumeRes.ok) {
      const resumeBlob = await resumeRes.blob();
      const resumeTx = db.transaction(['inodes', 'file_data'], 'readwrite');
      
      const users = ['peasant', 'abino'];
      for (const u of users) {
        const id = `home-${u}-desktop-resume`;
        const node: VFSNode = {
          id,
          name: 'Resume.pdf',
          type: 'file',
          parentId: `home-${u}-desktop`,
          permissions: 0o644,
          ownerId: u,
          groupId: u,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          accessedAt: Date.now(),
          sizeBytes: resumeBlob.size,
          hasBinaryContent: true,
          meta: { extension: 'pdf', mimeType: 'application/pdf' }
        };
        resumeTx.objectStore('inodes').put(node);
        resumeTx.objectStore('file_data').put(resumeBlob, id);
      }
      await resumeTx.done;
      console.log(`[VFS Seed] ✅ Seeded Resume.pdf to user desktops.`);
    }
  } catch (e) {
    console.warn(`[VFS Seed] Failed to seed Resume.pdf:`, e);
  }
}

/** Loads vfs_seed.json in the background without blocking the UI */
async function seedSnapshotInBackground() {
  try {
    const res = await fetch('/ubuntu/vfs_seed.json');
    if (!res.ok) return;
    const nodes: LegacyVFSNode[] = await res.json();
    console.log(`[VFS Seed BG] Seeding ${nodes.length} snapshot nodes in background...`);

    const db = await getDB();

    // Build dedup index: collect all existing (parentId, name) pairs from base seed
    const existingIndex = new Set<string>();
    const allExisting = await db.getAll('inodes');
    for (const node of allExisting) {
      if (node.parentId) {
        existingIndex.add(`${node.parentId}::${node.name}`);
      }
    }
    console.log(`[VFS Seed BG] Built dedup index with ${existingIndex.size} existing entries.`);

    const BATCH_SIZE = 1000;
    let written = 0;
    let skipped = 0;

    for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
      const batch = nodes.slice(i, i + BATCH_SIZE);
      const tx = db.transaction(['inodes', 'file_data'], 'readwrite');

      for (const legacy of batch) {
        try {
          const dedupKey = `${legacy.parentId}::${legacy.name}`;
          if (existingIndex.has(dedupKey)) {
            skipped++;
            continue;
          }
          existingIndex.add(dedupKey);

          const vfsNode = legacyToVFSNode(legacy);

          // Fix ownership: user home files should be owned by the user, not root
          if (legacy.parentId && legacy.parentId.startsWith('home-') && !legacy.parentId.startsWith('home-root')) {
            const username = legacy.parentId.replace('home-', '').split('-')[0];
            if (username && username !== 'root') {
              vfsNode.ownerId = legacy.owner || username;
              vfsNode.groupId = legacy.group || username;
            }
          }

          tx.objectStore('inodes').put(vfsNode);
          if (legacy.type === 'file' && legacy.content) {
            const blob = new Blob([legacy.content], { type: vfsNode.meta?.mimeType || 'text/plain' });
            tx.objectStore('file_data').put(blob, vfsNode.id);
          }
          written++;
        } catch (_) {}
      }

      await tx.done;

      // Yield to event loop so UI stays responsive
      await new Promise(r => setTimeout(r, 0));
    }

    console.log(`[VFS Seed BG] ✅ Background seeding complete. Written: ${written}, Skipped (deduped): ${skipped}.`);
    localStorage.setItem('vfs_fully_seeded', 'true');
  } catch (err) {
    console.warn('[VFS Seed BG] Background seeding failed (non-critical):', err);
  }
}
