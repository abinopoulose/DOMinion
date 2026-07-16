import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { VFSNode } from './types';

export interface VFSDB extends DBSchema {
  inodes: {
    key: string;
    value: VFSNode;
    indexes: {
      'by-parent': string;
      'by-name': string;
      'by-parent-and-name': [string, string];
    };
  };
  file_data: {
    key: string;
    value: Blob | ArrayBuffer;
  };
  symlinks: {
    key: string;
    value: string; // target path
  };
  thumbnails: {
    key: string;
    value: Blob;
  };
}

const DB_NAME = 'ubuntu-vfs';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<VFSDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<VFSDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VFSDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        if (oldVersion < 1) {
          const inodesStore = db.createObjectStore('inodes', { keyPath: 'id' });
          inodesStore.createIndex('by-parent', 'parentId');
          inodesStore.createIndex('by-name', 'name');
          // Compound index not possible with array unless values are array, but we can do it if idb supports it
          inodesStore.createIndex('by-parent-and-name', ['parentId', 'name']);
          
          db.createObjectStore('file_data');
          db.createObjectStore('symlinks');
        }
        if (oldVersion < 2) {
          db.createObjectStore('thumbnails');
        }
      },
    });
  }
  return dbPromise;
}

export async function closeDB() {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}
