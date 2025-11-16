export interface Spaceship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // radians, 0 = up
  thrusting: boolean;
  radius: number; // collision radius
}

export function createInitialShip(x: number, y: number): Spaceship {
  // Ship is initialized at world center and moves in world coordinates.
  return { x, y, vx: 0, vy: 0, angle: 0, thrusting: false, radius: 10 };
}

interface KeysState { up: boolean; left: boolean; right: boolean; }

const GRAVITY = 60; // px/s^2 downward
const THRUST = 140; // acceleration magnitude px/s^2
const ROT_SPEED = Math.PI; // radians per second
const RESTITUTION = 0.4; // bounce energy retention
const FRICTION = 0.85; // tangential velocity retention

import { Terrain, isCollidingWithTerrain, closestSegmentInfo, pointOutsideTerrain } from './terrain';

export function updateShip(ship: Spaceship, dt: number, keys: KeysState, terrain: Terrain, worldWidth = 900, worldHeight = 600) {
  // Handle rotation input
  if (keys.left) {
    ship.angle -= ROT_SPEED * dt;
  }
  if (keys.right) {
    ship.angle += ROT_SPEED * dt;
  }

  // Handle thrust input
  ship.thrusting = keys.up;
  if (keys.up) {
    // Apply thrust in ship's facing direction
    ship.vx += Math.sin(ship.angle) * THRUST * dt;
    ship.vy += -Math.cos(ship.angle) * THRUST * dt;
  }

  // Apply gravity
  ship.vy += GRAVITY * dt;

  // Integrate position
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Remove horizontal wrapping; enclosure handles boundaries.

  // Terrain enclosure collision & bounce
  if (isCollidingWithTerrain(ship.x, ship.y, ship.radius, terrain)) {
    const info = closestSegmentInfo({ x: ship.x, y: ship.y }, terrain);
    // Move ship slightly inward along normal (inside is opposite of outward normal)
    // Determine if actually outside; if outside, push inside.
    if (pointOutsideTerrain({ x: ship.x, y: ship.y }, terrain)) {
      // Project center to projection point minus radius along outward normal
      ship.x = info.px - info.nx * ship.radius;
      ship.y = info.py - info.ny * ship.radius;
    }
    const normalVelocity = ship.vx * info.nx + ship.vy * info.ny;
    ship.vx = ship.vx - (1 + RESTITUTION) * normalVelocity * info.nx;
    ship.vy = ship.vy - (1 + RESTITUTION) * normalVelocity * info.ny;
    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
  }

  // Clamp to canvas just in case (should not reach due to enclosure)
  if (ship.x < 0) { ship.x = 0; ship.vx = Math.abs(ship.vx) * 0.5; }
  if (ship.x > worldWidth) { ship.x = worldWidth; ship.vx = -Math.abs(ship.vx) * 0.5; }
  if (ship.y < 0) { ship.y = 0; ship.vy = Math.abs(ship.vy) * 0.5; }
  if (ship.y > worldHeight) { ship.y = worldHeight; ship.vy = -Math.abs(ship.vy) * 0.5; }
}
