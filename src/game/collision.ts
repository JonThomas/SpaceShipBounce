// Collision detection and response for spaceship and terrain
// Separated from spaceship.ts for modularity and clarity per copilot-instructions.md

import { Terrain, closestSegmentInfo, pointOutsideTerrain, isCollidingWithTerrain } from './terrain';
import { Spaceship } from './spaceship';

const RESTITUTION = 0.4; // bounce energy retention
const FRICTION = 0.85; // tangential velocity retention

export interface CollisionResult {
  collided: boolean;
  newValues?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
}

// Handles collision detection and response for a spaceship against terrain
export function handleShipTerrainCollision(ship: Spaceship, terrain: Terrain): CollisionResult {
  if (!isCollidingWithTerrain(ship.x, ship.y, ship.radius, terrain)) {
    return { collided: false };
  }
  const info = closestSegmentInfo({ x: ship.x, y: ship.y }, terrain);
  let x = ship.x;
  let y = ship.y;
  let vx = ship.vx;
  let vy = ship.vy;
  if (pointOutsideTerrain({ x, y }, terrain)) {
    // Project center to projection point minus radius along outward normal
    x = info.px - info.nx * ship.radius;
    y = info.py - info.ny * ship.radius;
  }
  const normalVelocity = vx * info.nx + vy * info.ny;
  vx = vx - (1 + RESTITUTION) * normalVelocity * info.nx;
  vy = vy - (1 + RESTITUTION) * normalVelocity * info.ny;
  vx *= FRICTION;
  vy *= FRICTION;

  return { collided: true, newValues: { x, y, vx, vy } };
}
