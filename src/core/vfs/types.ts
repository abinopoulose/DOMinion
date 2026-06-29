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
  meta?: {
    icon?: string;         // custom icon override
    mimeType?: string;     // e.g. "text/plain"
  };
}

export type NodeMap = Record<string, VFSNode>;
