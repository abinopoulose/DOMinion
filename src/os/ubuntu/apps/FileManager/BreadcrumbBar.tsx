import React from 'react';
import { useVFSStore } from '../../store';

interface BreadcrumbBarProps {
  currentCwdId: string;
  onNavigate: (id: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function BreadcrumbBar({
  currentCwdId,
  onNavigate,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
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
        <button className="fm-nav-btn" onClick={onBack} disabled={!canGoBack}>
          &lt;
        </button>
        <button className="fm-nav-btn" onClick={onForward} disabled={!canGoForward}>
          &gt;
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
