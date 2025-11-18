// Collision detection and response for spaceship and terrain
// Separated from spaceship.ts for modularity and clarity per copilot-instructions.md

import { Terrain, closestSegmentInfo, pointOutsideTerrain, isCollidingWithTerrain } from './terrain';
import { Spaceship } from './spaceship';

const RESTITUTION = 0.4; // bounce energy retention
const FRICTION = 0.85; // tangential velocity retention

export interface CollisionResult {
  collided: boolean;
  exploded: boolean;
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
