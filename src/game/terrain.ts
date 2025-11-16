export interface Point { x: number; y: number; }
export interface Terrain { points: Point[]; }

// Simple scenic terrain using combined sine waves.
export function generateTerrain(width: number, height: number): Terrain {
  const points: Point[] = [];
  const baseY = height * 0.75;
  const segments = 80;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const yOffset = Math.sin(i * 0.4) * 30 + Math.sin(i * 0.13) * 50 + Math.sin(i * 0.03) * 80;
    points.push({ x, y: baseY + yOffset });
  }
  return { points };
}

// Placeholder collision detection; will refine later.
export function sampleTerrainHeight(terrain: Terrain, x: number): number {
  // Assumes points sorted by x.
  const pts = terrain.points;
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  // Binary search for segment
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].x > x) hi = mid; else lo = mid;
  }
  const p1 = pts[lo];
  const p2 = pts[hi];
  const t = (x - p1.x) / (p2.x - p1.x);
  return p1.y + (p2.y - p1.y) * t;
}

export function terrainNormal(terrain: Terrain, x: number): { nx: number; ny: number } {
  const pts = terrain.points;
  if (x <= pts[0].x) return { nx: 0, ny: -1 };
  if (x >= pts[pts.length - 1].x) return { nx: 0, ny: -1 };
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].x > x) hi = mid; else lo = mid;
  }
  const p1 = pts[lo];
  const p2 = pts[hi];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Segment normal (perpendicular): (-dy, dx) then normalize; choose upward-ish orientation
  let nx = -dy;
  let ny = dx;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len; ny /= len;
  // Ensure normal points upward (negative y) if needed
  if (ny > 0) { nx = -nx; ny = -ny; }
  return { nx, ny };
}

export function isCollidingWithTerrain(x: number, y: number, radius: number, terrain: Terrain): boolean {
  const h = sampleTerrainHeight(terrain, x);
  return y + radius > h; // ship center below terrain surface
}
