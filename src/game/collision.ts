// Collision detection and response for spaceship and terrain
// Separated from spaceship.ts for modularity and clarity per copilot-instructions.md

import { Terrain, Point, TerrainPolygon } from './terrain';
import { Spaceship } from './spaceship';

// Safe spawn position constants
const MAX_SPAWN_ATTEMPTS = 100;
const SPAWN_SAFETY_RADIUS = 15; // Slightly larger than ship radius for safety margin
const SPAWN_AREA_MIN_RATIO = 0.3; // Start spawn area at 30% from edges
const SPAWN_AREA_SIZE_RATIO = 0.4; // Spawn area covers 40% of world size
const FALLBACK_CENTER_RATIO = 0.5; // Fallback to world center

export interface CollisionResult {
  collided: boolean;
  exploded: boolean;
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
  const p: Point = { x, y };
  
  // If center is outside terrain, collision occurs
  if (pointOutsideTerrain(p, terrain)) {
    return true;
  }
  
  // Check if spaceship radius penetrates any terrain boundary
  const closestSegment = closestSegmentInfo(p, terrain);
  return closestSegment.dist < radius;
}

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

// Handles collision detection and response for a spaceship against terrain
// Now triggers explosion instead of bounce
export function handleShipTerrainCollision(ship: Spaceship, terrain: Terrain): CollisionResult {
  // Skip collision if ship is already exploded
  if (ship.isExploded) {
    return { collided: false, exploded: false };
  }

  if (!isCollidingWithTerrain(ship.x, ship.y, ship.radius, terrain)) {
    return { collided: false, exploded: false };
  }

  // Collision detected - explode the ship
  ship.explode();
  return { collided: true, exploded: true };
}
