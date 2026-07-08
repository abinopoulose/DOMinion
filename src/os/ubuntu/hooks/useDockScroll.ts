import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export function useDockScroll() {
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;

    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isThrottled) return;

      const { nextWorkspace, prevWorkspace } = useWorkspaceStore.getState();
      
      if (e.deltaY > 0) {
        nextWorkspace();
      } else if (e.deltaY < 0) {
        prevWorkspace();
      }

      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, 300); // 300ms throttle for smooth feeling
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return dockRef;
}
