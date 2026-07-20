export type VFSNodeType = 'file' | 'directory' | 'symlink' | 'proc_file' | 'character_device';
export type LegacyVFSNodeType = 'file' | 'directory' | 'symlink' | 'proc_file' | 'character_device';

export interface LegacyVFSNode {
  id: string;
  name: string;
  type: LegacyVFSNodeType;
  parentId: string | null;
  children: string[];
  content: string;
  permissions?: string;
  owner?: string;
  group?: string;
  createdAt?: number;
  modifiedAt?: number;
  meta?: {
    mimeType?: string;
    extension?: string;
    icon?: string;
    isHidden?: boolean;
    isSymlink?: boolean;
    symlinkTarget?: string;
    originalParentId?: string;
    isStarred?: boolean;
  };
}

export type NodeMap = Record<string, LegacyVFSNode>;

export interface VFSNode {
  id: string;              // Unique identifier (UUID or inode equivalent)
  name: string;            // Name of the file/folder
  type: VFSNodeType;       // Node type
  parentId: string | null; // Root directory has null
  
  // POSIX-like attributes
  permissions: number;     // e.g., 0o755
  ownerId: string;         // 'root', 'user', etc.
  groupId: string;
  
  // Timestamps (Unix epoch ms)
  createdAt: number;       // ctime
  modifiedAt: number;      // mtime
  accessedAt: number;      // atime

  // Metadata
  sizeBytes: number;       // Exact size in bytes
  hasBinaryContent: boolean; // Flag to check if it has a corresponding blob
  
  meta?: {
    mimeType?: string;     // Explicit MIME type
    extension?: string;    // Extracted extension
    icon?: string;         // System icon override
    isHidden?: boolean;    // e.g., files starting with '.'
    isSymlink?: boolean;
    symlinkTarget?: string;
    originalParentId?: string; // stored when moved to trash
    isStarred?: boolean;   // used for starred files
  };
}

