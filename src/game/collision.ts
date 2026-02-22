// Collision detection and response for spaceship and terrain
// Separated from spaceship.ts for modularity and clarity per copilot-instructions.md

import { Terrain, Point, TerrainPolygon, Platform } from './terrain';
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

// Landing constants — tune these for difficulty.
// Speed ratio: fraction of ship.maxSpeed allowed for safe landing (0.24 = 24%)
const LANDING_SPEED_RATIO = 0.24;
// Angle tolerance: max degrees off from platform perpendicular for safe landing
const LANDING_ANGLE_TOLERANCE_DEG = 15;
const LANDING_ANGLE_COS = Math.cos(LANDING_ANGLE_TOLERANCE_DEG * Math.PI / 180);
// Proximity distance: ship-center to platform-center distance within which the visual cue activates
export const LANDING_PROXIMITY_DISTANCE = 200;
// Grace factor: collision check allows this fraction more speed than the indicator threshold
// to prevent "green indicator but still explodes" due to gravity between render and collision frames
const LANDING_COLLISION_GRACE = 1.15;

// Landing assist constants
const ASSIST_RANGE = 60; // px from platform surface where assists activate
const ROTATION_ASSIST_RATE = 0.8; // radians/sec max rotational nudge
const BRAKE_RANGE = 40; // px from platform surface where braking activates
const BRAKE_FACTOR = 0.3; // fraction of approach speed to remove per second

// Find the nearest platform whose surface is within collision distance of the ship
export function findNearestPlatform(x: number, y: number, radius: number, platforms: Platform[]): Platform | null {
  for (const platform of platforms) {
    const dx = platform.p2.x - platform.p1.x;
    const dy = platform.p2.y - platform.p1.y;
    const segLenSq = dx * dx + dy * dy;
    if (segLenSq === 0) {
      continue;
    }
    let t = ((x - platform.p1.x) * dx + (y - platform.p1.y) * dy) / segLenSq;
    if (t < 0) {
      t = 0;
    }
    if (t > 1) {
      t = 1;
    }
    const projX = platform.p1.x + dx * t;
    const projY = platform.p1.y + dy * t;
    const dist = Math.hypot(x - projX, y - projY);
    if (dist < radius) {
      return platform;
    }
  }
  return null;
}

// Check if the ship can safely land: speed must be low and ship roughly upright relative to the platform normal.
// graceFactor (default 1.0) multiplies the speed threshold — used by collision to add a buffer
// so the indicator and collision agree even when gravity shifts speed between frames.
export function canLandOnPlatform(ship: Spaceship, platform: Platform, graceFactor: number = 1.0): boolean {
  // Speed check: impact speed must be within configured ratio of ship max speed (with optional grace)
  const maxLandingSpeed = LANDING_SPEED_RATIO * ship.maxSpeed * graceFactor;
  if (ship.currentSpeed > maxLandingSpeed) {
    return false;
  }
  // Angle check: ship nose must be within ±LANDING_ANGLE_TOLERANCE_DEG of platform perpendicular
  // Ship nose direction: angle 0 = up → (sin(angle), -cos(angle))
  const shipUpX = Math.sin(ship.angle);
  const shipUpY = -Math.cos(ship.angle);
  const dot = shipUpX * platform.nx + shipUpY * platform.ny;
  return dot > LANDING_ANGLE_COS;
}

// Check if the ship is within the cue-activation proximity of a platform.
// Uses ship-center to platform-center (midpoint of p1–p2) distance.
export function isShipNearPlatform(ship: Spaceship, platform: Platform): boolean {
  const cx = (platform.p1.x + platform.p2.x) / 2;
  const cy = (platform.p1.y + platform.p2.y) / 2;
  const dist = Math.hypot(ship.x - cx, ship.y - cy);
  return dist <= LANDING_PROXIMITY_DISTANCE;
}

// Handles collision detection and response for a spaceship against terrain.
// Checks for platform landing before triggering explosion.
export function handleShipTerrainCollision(ship: Spaceship, terrain: Terrain): CollisionResult {
  // Skip collision if ship is already exploded or landed
  if (ship.isExploded || ship.isLanded) {
    return { collided: false, exploded: false };
  }

  if (!isCollidingWithTerrain(ship.x, ship.y, ship.radius, terrain)) {
    return { collided: false, exploded: false };
  }

  // Check if the collision is with a platform (use grace factor to prevent green-indicator-but-explodes)
  const platform = findNearestPlatform(ship.x, ship.y, ship.radius, terrain.platforms);
  if (platform && canLandOnPlatform(ship, platform, LANDING_COLLISION_GRACE)) {
    // Successful landing — freeze ship on the platform surface
    ship.isLanded = true;
    ship.landedNx = platform.nx;
    ship.landedNy = platform.ny;
    ship.vx = 0;
    ship.vy = 0;
    ship.thrusting = false;
    ship.currentSpeed = 0;

    // Snap ship to platform surface offset by its radius along the normal
    const dx = platform.p2.x - platform.p1.x;
    const dy = platform.p2.y - platform.p1.y;
    const segLenSq = dx * dx + dy * dy;
    let t = ((ship.x - platform.p1.x) * dx + (ship.y - platform.p1.y) * dy) / segLenSq;
    if (t < 0) {
      t = 0;
    }
    if (t > 1) {
      t = 1;
    }
    ship.x = platform.p1.x + dx * t + platform.nx * ship.radius;
    ship.y = platform.p1.y + dy * t + platform.ny * ship.radius;

    return { collided: true, exploded: false };
  }

  // Collision detected (regular terrain or failed landing) — explode the ship
  ship.explode();
  return { collided: true, exploded: true };
}

// Apply gentle landing assists when the ship is near a platform.
// Rotational nudge aligns ship to the platform normal; braking reduces approach speed.
// Call after updateShip and before collision detection each physics frame.
export function applyLandingAssists(ship: Spaceship, platforms: Platform[], dt: number): void {
  if (ship.isExploded || ship.isLanded) {
    return;
  }

  for (const platform of platforms) {
    // Project ship onto platform segment to find distance to surface
    const dx = platform.p2.x - platform.p1.x;
    const dy = platform.p2.y - platform.p1.y;
    const segLenSq = dx * dx + dy * dy;
    if (segLenSq === 0) {
      continue;
    }
    let t = ((ship.x - platform.p1.x) * dx + (ship.y - platform.p1.y) * dy) / segLenSq;
    if (t < 0) {
      t = 0;
    }
    if (t > 1) {
      t = 1;
    }
    const projX = platform.p1.x + dx * t;
    const projY = platform.p1.y + dy * t;
    const dist = Math.hypot(ship.x - projX, ship.y - projY);

    if (dist > ASSIST_RANGE) {
      continue;
    }

    // Only assist if ship is on the correct side (in front of the platform, not behind)
    const toShipX = ship.x - projX;
    const toShipY = ship.y - projY;
    const sideCheck = toShipX * platform.nx + toShipY * platform.ny;
    if (sideCheck < 0) {
      continue;
    }

    // Strength ramps up as ship gets closer (0 at edge, 1 at surface)
    const strength = 1 - dist / ASSIST_RANGE;

    // Rotational assist: gently nudge ship angle toward platform normal
    const targetAngle = Math.atan2(platform.nx, -platform.ny);
    let angleDiff = targetAngle - ship.angle;
    // Normalize to [-π, π]
    while (angleDiff > Math.PI) {
      angleDiff -= 2 * Math.PI;
    }
    while (angleDiff < -Math.PI) {
      angleDiff += 2 * Math.PI;
    }
    ship.angle += angleDiff * strength * ROTATION_ASSIST_RATE * dt;

    // Speed braking: reduce approach speed when very close and moving toward platform
    if (dist < BRAKE_RANGE) {
      const approachSpeed = -(ship.vx * platform.nx + ship.vy * platform.ny);
      if (approachSpeed > 0) {
        const brakeStrength = 1 - dist / BRAKE_RANGE;
        const brakeAmount = approachSpeed * BRAKE_FACTOR * brakeStrength * dt;
        ship.vx += platform.nx * brakeAmount;
        ship.vy += platform.ny * brakeAmount;
        // Recalculate cached speed after braking
        ship.currentSpeed = Math.hypot(ship.vx, ship.vy);
      }
    }

    // Only assist with the nearest qualifying platform
    break;
  }
}
