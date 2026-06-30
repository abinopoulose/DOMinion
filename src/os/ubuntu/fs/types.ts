export type VFSNodeType = 'file' | 'directory';

export interface VFSNode {
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
  };
}

export type NodeMap = Record<string, VFSNode>;
