export interface Point { x: number; y: number; }
export interface Terrain { points: Point[]; }

// Simple scenic terrain using combined sine waves.
export function generateTerrain(width: number, height: number): Terrain {
  // Generate terrain using layered sine waves
  const points: Point[] = [];
  const BASE_Y = height * 0.75;
  const SEGMENTS = 80;
  for (let i = 0; i <= SEGMENTS; i++) {
    const x = (i / SEGMENTS) * width;
    // Layered sine waves for terrain
    const yOffset = Math.sin(i * 0.4) * 30 + Math.sin(i * 0.13) * 50 + Math.sin(i * 0.03) * 80;
    points.push({ x, y: BASE_Y + yOffset });
  }
  return { points };
}

// Placeholder collision detection; will refine later.
export function sampleTerrainHeight(terrain: Terrain, x: number): number {
  // Find terrain height at x using linear interpolation
  const points = terrain.points;
  if (x <= points[0].x) {
    return points[0].y;
  }
  if (x >= points[points.length - 1].x) {
    return points[points.length - 1].y;
  }
  // Binary search for segment
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x > x) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  const p1 = points[lo];
  const p2 = points[hi];
  const t = (x - p1.x) / (p2.x - p1.x);
  return p1.y + (p2.y - p1.y) * t;
}

export function terrainNormal(terrain: Terrain, x: number): { nx: number; ny: number } {
  // Compute terrain normal at x
  const points = terrain.points;
  if (x <= points[0].x) {
    return { nx: 0, ny: -1 };
  }
  if (x >= points[points.length - 1].x) {
    return { nx: 0, ny: -1 };
  }
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x > x) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  const p1 = points[lo];
  const p2 = points[hi];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Perpendicular vector (normal)
  let nx = -dy;
  let ny = dx;
  const length = Math.hypot(nx, ny) || 1;
  nx /= length;
  ny /= length;
  // Ensure normal points upward
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { nx, ny };
}

export function isCollidingWithTerrain(x: number, y: number, radius: number, terrain: Terrain): boolean {
  // Check if ship is below terrain surface
  const terrainHeight = sampleTerrainHeight(terrain, x);
  return y + radius > terrainHeight;
}
