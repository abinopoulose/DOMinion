import { useEffect, useState, useRef } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import './WorkspaceOSD.css';

export function WorkspaceOSD() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceCount = useWorkspaceStore((s) => s.workspaceCount);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsVisible(true);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 800);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeWorkspace]);

  return (
    <div className={`workspace-osd-container ${isVisible ? 'visible' : ''}`}>
      {Array.from({ length: workspaceCount }).map((_, idx) => (
        <div 
          key={idx} 
          className={`workspace-osd-dot ${idx === activeWorkspace ? 'active' : ''}`} 
        />
      ))}
    </div>
  );
}
