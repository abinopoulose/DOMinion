import { describe, it, expect } from 'vitest';
import { calculateTileBounds, getEdgeSnap, getTopEdgeSnap } from '../../../../src/os/ubuntu/engine/WindowManagerEngine';

describe('WindowManagerEngine', () => {
  const bounds = {
    maxWidth: 1000,
    maxHeight: 1000,
    maxTop: 30, // top bar
    maxBottom: 60, // dock
    maxLeft: 0,
    maxRight: 0
  };

  it('calculates left tile bounds', () => {
    const rect = calculateTileBounds('left', bounds);
    expect(rect).toEqual({
      x: 0,
      y: 30,
      width: 500,
      height: 910 // 1000 - 30 - 60
    });
  });

  it('calculates right tile bounds', () => {
    const rect = calculateTileBounds('right', bounds);
    expect(rect).toEqual({
      x: 500,
      y: 30,
      width: 500,
      height: 910
    });
  });

  it('returns null if side is null', () => {
    expect(calculateTileBounds(null as any, bounds)).toBeNull();
  });

  it('detects edge snap', () => {
    expect(getEdgeSnap(10, 1000)).toBe('left');
    expect(getEdgeSnap(990, 1000)).toBe('right');
    expect(getEdgeSnap(500, 1000)).toBeNull();
  });

  it('detects top edge snap', () => {
    expect(getTopEdgeSnap(10)).toBe(true);
    expect(getTopEdgeSnap(50)).toBe(false);
  });
});
