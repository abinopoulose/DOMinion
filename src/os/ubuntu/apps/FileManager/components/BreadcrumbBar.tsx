import React from 'react';
import { useVFSStore } from '../../../store';

interface BreadcrumbBarProps {
  currentCwdId: string;
  onNavigate: (id: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function BreadcrumbBar({
  currentCwdId,
  onNavigate,
  canGoBack,
  canGoForward,
  canGoUp,
  onBack,
  onForward,
  onUp,
  viewMode,
  onViewModeChange,
}: BreadcrumbBarProps) {
  const vfsStore = useVFSStore();

  const getSegments = (id: string) => {
    const segments = [];
    let current = vfsStore.getNode(id);
    while (current) {
      segments.unshift(current);
      if (current.parentId) {
        current = vfsStore.getNode(current.parentId);
      } else {
        current = null;
      }
    }
    return segments;
  };

  const segments = getSegments(currentCwdId);

  return (
    <div className="fm-header">
      <div className="fm-nav-buttons">
        <button className="fm-nav-btn" onClick={onBack} disabled={!canGoBack} title="Back">
          &lt;
        </button>
        <button className="fm-nav-btn" onClick={onForward} disabled={!canGoForward} title="Forward">
          &gt;
        </button>
        <button className="fm-nav-btn" onClick={onUp} disabled={!canGoUp} title="Up">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11 20V7.825L5.4 13.425L4 12L12 4L20 12L18.6 13.425L13 7.825V20H11Z"/>
          </svg>
        </button>
      </div>
      
      <div className="fm-breadcrumbs">
        {segments.map((seg, idx) => (
          <React.Fragment key={seg.id}>
            <button className="fm-breadcrumb-btn" onClick={() => onNavigate(seg.id)}>
              {seg.name || '/'}
            </button>
            {idx < segments.length - 1 && <span className="fm-breadcrumb-sep">&gt;</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="fm-view-toggles">
        <button
          className={`fm-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
        >
          ☷
        </button>
        <button
          className={`fm-view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
