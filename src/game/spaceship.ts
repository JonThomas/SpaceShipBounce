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
  return { x, y, vx: 0, vy: 0, angle: 0, thrusting: false, radius: 10 };
}

interface KeysState { up: boolean; left: boolean; right: boolean; }

const GRAVITY = 60; // px/s^2 downward
const THRUST = 140; // acceleration magnitude px/s^2
const ROT_SPEED = Math.PI; // radians per second
const RESTITUTION = 0.4; // bounce energy retention
const FRICTION = 0.85; // tangential velocity retention

import { Terrain, isCollidingWithTerrain, sampleTerrainHeight, terrainNormal } from './terrain';

export function updateShip(ship: Spaceship, dt: number, keys: KeysState, terrain: Terrain, worldWidth = 900, worldHeight = 600) {
  // Rotation
  if (keys.left) ship.angle -= ROT_SPEED * dt;
  if (keys.right) ship.angle += ROT_SPEED * dt;

  // Thrust
  ship.thrusting = keys.up;
  if (keys.up) {
    ship.vx += Math.sin(ship.angle) * THRUST * dt; // sin because angle 0 is up
    ship.vy += -Math.cos(ship.angle) * THRUST * dt; // negative cos for upward thrust
  }

  // Gravity
  ship.vy += GRAVITY * dt;

  // Integrate position
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Horizontal wrap
  if (ship.x < 0) ship.x += worldWidth;
  if (ship.x > worldWidth) ship.x -= worldWidth;

  // Terrain collision & bounce
  if (isCollidingWithTerrain(ship.x, ship.y, ship.radius, terrain)) {
    // Move ship just above terrain
    const height = sampleTerrainHeight(terrain, ship.x) - ship.radius;
    ship.y = height;
    // Compute normal
    const { nx, ny } = terrainNormal(terrain, ship.x);
    // Velocity components
    const dot = ship.vx * nx + ship.vy * ny;
    // Reflect normal component
    ship.vx = ship.vx - (1 + RESTITUTION) * dot * nx;
    ship.vy = ship.vy - (1 + RESTITUTION) * dot * ny;
    // Apply simple friction to tangential component (approx by scaling total velocity)
    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
  }

  // Ceiling clamp
  if (ship.y < 0) { ship.y = 0; ship.vy = 0; }
}
