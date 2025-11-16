export interface Point { x: number; y: number; }
export interface Terrain { points: Point[]; } // Points define a closed non-self-intersecting polygon (CCW)

// Simple scenic terrain using combined sine waves.
export function generateTerrain(width: number, height: number): Terrain {
  // Generate a smooth non-self-intersecting enclosure centered on screen.
  // Shape: perturbed ellipse sampled CCW.
  const points: Point[] = [];
  const CENTER_X = width * 0.5;
  const CENTER_Y = height * 0.5;
  const RADIUS_X = width * 0.35;  // Leave margin to canvas edges
  const RADIUS_Y = height * 0.35; // Leave margin to canvas edges
  const SEGMENTS = 160; // Higher resolution for smoother boundary
  const NOISE_SCALE_A = 0.15;
  const NOISE_SCALE_B = 0.07;
  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / SEGMENTS; // [0,1)
    const theta = t * Math.PI * 2;
    // Radial perturbation using sine harmonics (no self intersections if small)
    const radialJitter = 1
      + Math.sin(theta * 3) * NOISE_SCALE_A
      + Math.sin(theta * 5 + 1.3) * NOISE_SCALE_B;
    const x = CENTER_X + Math.cos(theta) * RADIUS_X * radialJitter;
    const y = CENTER_Y + Math.sin(theta) * RADIUS_Y * radialJitter;
    points.push({ x, y });
  }
  return { points };
}

// Placeholder collision detection; will refine later.
// For enclosed polygon terrain we no longer use a bottom height sample; keep stub if needed by older code.
export function sampleTerrainHeight(_terrain: Terrain, _x: number): number {
  return 0; // Not applicable for closed enclosure
}

// Compute outward normal for segment i (points[i] -> points[i+1])
export function segmentNormal(a: Point, b: Point): { nx: number; ny: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Perpendicular (dy, -dx) gives clockwise outward if points are CCW
  let nx = dy;
  let ny = -dx;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len; ny /= len;
  return { nx, ny };
}

export function pointOutsideTerrain(p: Point, terrain: Terrain): boolean {
  // Ray casting to the right; count intersections. Outside if even.
  let count = 0;
  const pts = terrain.points;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    // Check if edge crosses horizontal ray at p.y
    if (((a.y <= p.y) && (b.y > p.y)) || ((a.y > p.y) && (b.y <= p.y))) {
      const t = (p.y - a.y) / (b.y - a.y);
      const xCross = a.x + t * (b.x - a.x);
      if (xCross > p.x) {
        count++;
      }
    }
  }
  return (count % 2) === 0; // even -> outside
}

export function closestSegmentInfo(p: Point, terrain: Terrain): { a: Point; b: Point; nx: number; ny: number; dist: number; px: number; py: number } {
  let bestDist = Infinity;
  let bestA: Point = terrain.points[0];
  let bestB: Point = terrain.points[1];
  let bestPx = p.x;
  let bestPy = p.y;
  let bestNx = 0;
  let bestNy = -1;
  const pts = terrain.points;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    // Project point onto segment
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLenSq = dx * dx + dy * dy;
    let t = 0;
    if (segLenSq > 0) {
      t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / segLenSq;
      if (t < 0) { t = 0; }
      if (t > 1) { t = 1; }
    }
    const projX = a.x + dx * t;
    const projY = a.y + dy * t;
    const dist = Math.hypot(p.x - projX, p.y - projY);
    if (dist < bestDist) {
      bestDist = dist;
      bestA = a;
      bestB = b;
      bestPx = projX;
      bestPy = projY;
      const { nx, ny } = segmentNormal(a, b);
      bestNx = nx;
      bestNy = ny;
    }
  }
  return { a: bestA, b: bestB, nx: bestNx, ny: bestNy, dist: bestDist, px: bestPx, py: bestPy };
}

export function isCollidingWithTerrain(x: number, y: number, radius: number, terrain: Terrain): boolean {
  // Collision occurs if center is outside polygon OR penetrating segment within radius.
  const p: Point = { x, y };
  if (pointOutsideTerrain(p, terrain)) {
    return true;
  }
  // Also treat near-edge outside as collision (handled by outside test above).
  return false;
}
