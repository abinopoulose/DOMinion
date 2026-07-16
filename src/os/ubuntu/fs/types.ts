export type VFSNodeType = 'file' | 'directory' | 'symlink' | 'proc_file' | 'character_device';
export type LegacyVFSNodeType = VFSNodeType;

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

// For migration purposes
export interface LegacyVFSNode {
  id: string;              // uuid
  name: string;            // "Documents"
  type: VFSNodeType;
  parentId: string | null; // null = root
  children: string[];      // ordered child IDs (directories only)
  content: string;         // file content (files only, empty string for dirs)
  createdAt: number;       // epoch ms
  modifiedAt: number;      // epoch ms
  owner: string;           // e.g. "user", "root"
  group: string;           // e.g. "user", "root"
  permissions: string;     // e.g. "755", "644"
  meta?: {
    icon?: string;         // custom icon override
    mimeType?: string;     // e.g. "text/plain"
    extension?: string;    // e.g. "txt", "js"
    originalParentId?: string; // stored when moved to trash
    isStarred?: boolean;   // used for starred files
  };
}

export type NodeMap = Record<string, LegacyVFSNode>;
