
export interface Spaceship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // radians, 0 = up
  thrusting: boolean;
  radius: number; // collision radius
  maxSpeed: number; // maximum speed magnitude for HUD scaling & gameplay
  currentSpeed: number; // cached speed magnitude after clamping each update
  setPositionAndVelocity: (x: number, y: number, vx: number, vy: number) => void;
  shouldRenderFlame: () => boolean;
}

export function createInitialShip(x: number, y: number): Spaceship {
  // Ship is initialized at world center and moves in world coordinates.
  const ship: Spaceship = {
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    thrusting: false,
    radius: 10,
    maxSpeed: 500,
    currentSpeed: 0,
    setPositionAndVelocity: function (newX: number, newY: number, newVx: number, newVy: number) {
      this.x = newX;
      this.y = newY;
      this.vx = newVx;
      this.vy = newVy;
    },
    shouldRenderFlame: function () {
      return this.thrusting && this.currentSpeed < this.maxSpeed;
    }
  };
  return ship;
}

interface KeysState { up: boolean; left: boolean; right: boolean; }

const GRAVITY = 60; // px/s^2 downward
const THRUST = 140; // acceleration magnitude px/s^2
const ROT_SPEED = Math.PI; // radians per second
const RESTITUTION = 0.4; // bounce energy retention
const FRICTION = 0.85; // tangential velocity retention

export function updateShip(ship: Spaceship, dt: number, keys: KeysState) {
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

  // Limit speed to max speed (reduce if needed)
  ship.currentSpeed = Math.hypot(ship.vx, ship.vy);
  if (ship.currentSpeed >= ship.maxSpeed) {
    const scale = ship.maxSpeed / ship.currentSpeed;
    ship.vx *= scale;
    ship.vy *= scale;
  }

}
