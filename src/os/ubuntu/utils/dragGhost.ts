import React from 'react';

let activeClones: { el: HTMLElement, offsetX: number, offsetY: number, isLead: boolean, index: number }[] = [];
let emptyImage: HTMLImageElement | null = null;

export function initDynamicDrag(
  e: React.DragEvent,
  selectedIds: string[],
  draggedId: string,
  selectorPrefix: string
) {
  if (selectedIds.length === 0) return;

  // Create an invisible image for the native drag ghost so we can use DOM clones instead
  if (!emptyImage) {
    emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
  e.dataTransfer.setDragImage(emptyImage, 0, 0);

  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const leadContainer = document.querySelector(`${selectorPrefix}[data-sel-id="${draggedId}"]`) as HTMLElement;
  if (!leadContainer) return;
  const leadEl = leadContainer.querySelector('img') || leadContainer;

  const leadRect = leadEl.getBoundingClientRect();
  const grabOffsetX = mouseX - leadRect.left;
  const grabOffsetY = mouseY - leadRect.top;

  // Prioritize lead item, then up to 4 others
  const others = selectedIds.filter(id => id !== draggedId).slice(0, 4);
  const idsToClone = [draggedId, ...others];

  activeClones = [];

  idsToClone.forEach((id, index) => {
    const isLead = index === 0;
    const originalContainer = document.querySelector(`${selectorPrefix}[data-sel-id="${id}"]`) as HTMLElement;
    if (!originalContainer) return;
    const originalEl = originalContainer.querySelector('img') || originalContainer;

    const rect = originalEl.getBoundingClientRect();
    const clone = originalEl.cloneNode(true) as HTMLElement;
    
    clone.style.position = 'fixed';
    clone.style.left = '0px';
    clone.style.top = '0px';
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = `${9999 - index}`;
    clone.style.opacity = '0.9';
    clone.style.boxShadow = 'none'; // Ensure no rectangular shadow
    clone.style.filter = isLead ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))';
    
    // Start at original position
    clone.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    
    // Followers have a nice spring transition so they "fly" into the stack.
    if (!isLead) {
      clone.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    } else {
      clone.style.transition = 'transform 0.05s linear'; // slight smoothing for lead
    }

    document.body.appendChild(clone);
    clone.getBoundingClientRect(); // force reflow

    // Stack offset relative to lead
    const stackOffsetX = isLead ? 0 : index * 6;
    const stackOffsetY = isLead ? 0 : index * 6;

    activeClones.push({
      el: clone,
      offsetX: grabOffsetX - stackOffsetX,
      offsetY: grabOffsetY - stackOffsetY,
      isLead,
      index
    });
  });
  
  // Badge
  if (selectedIds.length > 1) {
     const badge = document.createElement('div');
     badge.textContent = selectedIds.length.toString();
     badge.style.position = 'fixed';
     badge.style.left = '0px';
     badge.style.top = '0px';
     badge.style.backgroundColor = '#e95420';
     badge.style.color = 'white';
     badge.style.borderRadius = '50%';
     badge.style.width = '24px';
     badge.style.height = '24px';
     badge.style.display = 'flex';
     badge.style.alignItems = 'center';
     badge.style.justifyContent = 'center';
     badge.style.fontSize = '12px';
     badge.style.fontWeight = 'bold';
     badge.style.zIndex = '10000';
     badge.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
     badge.style.pointerEvents = 'none';
     
     // Start badge at lead rect
     badge.style.transform = `translate(${leadRect.right - 12}px, ${leadRect.top - 12}px)`;
     
     document.body.appendChild(badge);
     badge.getBoundingClientRect(); // force reflow
     
     activeClones.push({
       el: badge,
       offsetX: grabOffsetX - leadRect.width + 12 - (others.length * 6), // Follows the final stacked bounds
       offsetY: grabOffsetY + 12,
       isLead: false,
       index: 99
     });
  }

  // Initial trigger to move them to mouse immediately
  updateDynamicDrag(e);
}

export function updateDynamicDrag(e: React.DragEvent | DragEvent) {
  if (activeClones.length === 0) return;
  // HTML5 drag events often fire 0,0 right before dragend or when off-screen
  if (e.clientX === 0 && e.clientY === 0) return;

  const mouseX = e.clientX;
  const mouseY = e.clientY;

  activeClones.forEach(cloneData => {
    const targetX = mouseX - cloneData.offsetX;
    const targetY = mouseY - cloneData.offsetY;
    cloneData.el.style.transform = `translate(${targetX}px, ${targetY}px)`;
  });
}

export function cleanupDynamicDrag() {
  activeClones.forEach(cloneData => {
    if (document.body.contains(cloneData.el)) {
      document.body.removeChild(cloneData.el);
    }
  });
  activeClones = [];
}
