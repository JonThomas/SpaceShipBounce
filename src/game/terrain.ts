export interface Point { x: number; y: number; }
export interface TerrainPolygon { points: Point[]; } // Points define a closed non-self-intersecting polygon (CCW)
export interface Terrain { 
  mainTerrain: TerrainPolygon; // The outer boundary terrain
  islands: TerrainPolygon[]; // Array of island polygons within the main terrain
}

// Main terrain generation constants
const TERRAIN_CENTER_RATIO = 0.5; // Center terrain at middle of world
const TERRAIN_RADIUS_RATIO = 0.35; // Leave margin to canvas edges
const TERRAIN_SEGMENTS = 160; // Higher resolution for smoother boundary
const TERRAIN_NOISE_SCALE_A = 0.15; // Primary noise component
const TERRAIN_NOISE_SCALE_B = 0.07; // Secondary noise component
const TERRAIN_NOISE_FREQ_A = 3; // Primary noise frequency
const TERRAIN_NOISE_FREQ_B = 5; // Secondary noise frequency
const TERRAIN_NOISE_PHASE_B = 1.3; // Phase offset for secondary noise

// Generate main terrain boundary (outer perimeter)
export function generateMainTerrain(width: number, height: number): TerrainPolygon {
  const points: Point[] = [];
  const CENTER_X = width * TERRAIN_CENTER_RATIO;
  const CENTER_Y = height * TERRAIN_CENTER_RATIO;
  const RADIUS_X = width * TERRAIN_RADIUS_RATIO;
  const RADIUS_Y = height * TERRAIN_RADIUS_RATIO;
  
  for (let i = 0; i < TERRAIN_SEGMENTS; i++) {
    const t = i / TERRAIN_SEGMENTS; // [0,1)
    const theta = t * Math.PI * 2;
    // Radial perturbation using sine harmonics (no self intersections if small)
    const radialJitter = 1
      + Math.sin(theta * TERRAIN_NOISE_FREQ_A) * TERRAIN_NOISE_SCALE_A
      + Math.sin(theta * TERRAIN_NOISE_FREQ_B + TERRAIN_NOISE_PHASE_B) * TERRAIN_NOISE_SCALE_B;
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

export function pointOutsidePolygon(p: Point, polygon: TerrainPolygon): boolean {
  // Fast bounding box check first (much faster than ray-casting)
  const points = polygon.points;
  if (points.length === 0) return true;
  
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  
  // If point is outside bounding box, it's definitely outside polygon
  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
    return true;
  }
  
  // Only do expensive ray-casting if point is within bounding box
  // Ray casting to the right; count intersections. Outside if even.
  let count = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
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

export function pointOutsideTerrain(p: Point, terrain: Terrain): boolean {
  // Point is outside terrain if it's outside the main boundary OR inside any island
  // Check main terrain first - if outside, we can skip island checks
  if (pointOutsidePolygon(p, terrain.mainTerrain)) {
    return true;
  }
  
  // Only check islands if we're inside the main terrain
  // Check if point is inside any island (which means it's in solid terrain)
  for (const island of terrain.islands) {
    if (!pointOutsidePolygon(p, island)) {
      return true; // Inside island = outside playable area
    }
  }
  
  return false; // Inside main terrain and outside all islands
}

function closestSegmentInfoForPolygon(p: Point, polygon: TerrainPolygon): { a: Point; b: Point; nx: number; ny: number; dist: number; px: number; py: number } {
  let bestDist = Infinity;
  let bestA: Point = polygon.points[0];
  let bestB: Point = polygon.points[1];
  let bestPx = p.x;
  let bestPy = p.y;
  let bestNx = 0;
  let bestNy = -1;
  const pts = polygon.points;
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
      if (t < 0) { 
        t = 0; 
      }
      if (t > 1) { 
        t = 1; 
      }
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

export function closestSegmentInfo(p: Point, terrain: Terrain): { a: Point; b: Point; nx: number; ny: number; dist: number; px: number; py: number } {
  // Find closest segment across all polygons (main terrain + islands)
  let bestInfo = closestSegmentInfoForPolygon(p, terrain.mainTerrain);
  
  for (const island of terrain.islands) {
    const islandInfo = closestSegmentInfoForPolygon(p, island);
    if (islandInfo.dist < bestInfo.dist) {
      bestInfo = islandInfo;
    }
  }
  
  return bestInfo;
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

// Safe spawn position constants
const MAX_SPAWN_ATTEMPTS = 100;
const SPAWN_SAFETY_RADIUS = 15; // Slightly larger than ship radius for safety margin
const SPAWN_AREA_MIN_RATIO = 0.3; // Start spawn area at 30% from edges
const SPAWN_AREA_SIZE_RATIO = 0.4; // Spawn area covers 40% of world size
const FALLBACK_CENTER_RATIO = 0.5; // Fallback to world center

// Find a safe spawn position that avoids all terrain including islands
export function findSafeSpawnPosition(terrain: Terrain, worldWidth: number, worldHeight: number): Point {
  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    // Try positions in a central area of the world
    const x = worldWidth * SPAWN_AREA_MIN_RATIO + Math.random() * worldWidth * SPAWN_AREA_SIZE_RATIO;
    const y = worldHeight * SPAWN_AREA_MIN_RATIO + Math.random() * worldHeight * SPAWN_AREA_SIZE_RATIO;
    
    if (!isCollidingWithTerrain(x, y, SPAWN_SAFETY_RADIUS, terrain)) {
      return { x, y };
    }
  }
  
  // Fallback to world center if no safe position found
  return { x: worldWidth * FALLBACK_CENTER_RATIO, y: worldHeight * FALLBACK_CENTER_RATIO };
}
