/**
 * Pure functions for Window geometry calculations (Tiling, Snapping).
 */

export type TileSide = 'left' | 'right' | null;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenBounds {
  maxWidth: number;
  maxHeight: number;
  maxTop: number;
  maxBottom: number;
  maxLeft: number;
  maxRight: number;
}

/**
 * Calculates the bounding box for a tiled window.
 */
export function calculateTileBounds(side: TileSide, bounds: ScreenBounds): Rect | null {
  if (!side) return null;

  // e.g. Left tile takes up 50% of the screen horizontally between dock/edges
  const availableWidth = bounds.maxWidth - bounds.maxLeft - bounds.maxRight;
  const availableHeight = bounds.maxHeight - bounds.maxTop - bounds.maxBottom;
  
  const halfWidth = availableWidth / 2;

  if (side === 'left') {
    return {
      x: bounds.maxLeft,
      y: bounds.maxTop,
      width: halfWidth,
      height: availableHeight,
    };
  } else {
    return {
      x: bounds.maxLeft + halfWidth,
      y: bounds.maxTop,
      width: halfWidth,
      height: availableHeight,
    };
  }
}

/**
 * Detects if a pointer coordinate is at the edge of the screen and returns the snapped side.
 */
export function getEdgeSnap(clientX: number, screenWidth: number): TileSide {
  if (clientX <= 20) {
    return 'left';
  } else if (clientX >= screenWidth - 20) {
    return 'right';
  }
  return null;
}

/**
 * Detects if a pointer coordinate is at the top edge of the screen (maximize).
 */
export function getTopEdgeSnap(clientY: number): boolean {
  return clientY <= 30;
}
