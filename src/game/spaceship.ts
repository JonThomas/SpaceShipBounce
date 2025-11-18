
export interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, starts at 1
  size: number;
  color: string;
}

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
  isExploded: boolean;
  explosionTime: number;
  explosionParticles: ExplosionParticle[];
  setPositionAndVelocity: (x: number, y: number, vx: number, vy: number) => void;
  shouldRenderFlame: () => boolean;
  explode: () => void;
  reset: (x: number, y: number) => void;
}

export function createInitialShip(x: number, y: number): Spaceship {
  // Ship is initialized at world center and moves in world coordinates.
  const ship: Spaceship = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    thrusting: false,
    radius: 10,
    maxSpeed: 500,
    currentSpeed: 0,
    isExploded: false,
    explosionTime: 0,
    explosionParticles: [],
    setPositionAndVelocity: function (newX: number, newY: number, newVx: number, newVy: number) {
      this.x = newX;
      this.y = newY;
      this.vx = newVx;
      this.vy = newVy;
    },
    shouldRenderFlame: function () {
      return this.thrusting && this.currentSpeed < this.maxSpeed && !this.isExploded;
    },
    explode: function () {
      this.isExploded = true;
      this.explosionTime = 0;
      this.thrusting = false;
      this.vx = 0;
      this.vy = 0;
      
      // Create explosion particles
      const particleCount = 20;
      this.explosionParticles = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 100 + Math.random() * 150;
        const particle: ExplosionParticle = {
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 2 + Math.random() * 4,
          color: Math.random() < 0.5 ? '#ff9f1c' : '#ff6b1c'
        };
        this.explosionParticles.push(particle);
      }
    },
    reset: function (newX: number, newY: number) {
      this.x = newX;
      this.y = newY;
      this.vx = 0;
      this.vy = 0;
      this.angle = 0;
      this.thrusting = false;
      this.currentSpeed = 0;
      this.isExploded = false;
      this.explosionTime = 0;
      this.explosionParticles = [];
    }
  };
  return ship;
}

interface KeysState { up: boolean; left: boolean; right: boolean; }

const GRAVITY = 60; // px/s^2 downward
const THRUST = 400; // acceleration magnitude px/s^2
const ROT_SPEED = Math.PI; // radians per second
const EXPLOSION_DURATION = 3; // seconds

export function updateShip(ship: Spaceship, dt: number, keys: KeysState) {
  // Handle explosion state
  if (ship.isExploded) {
    ship.explosionTime += dt;
    
    // Update explosion particles
    for (const particle of ship.explosionParticles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += GRAVITY * dt; // Particles affected by gravity
      particle.life -= dt / EXPLOSION_DURATION;
    }
    
    // Remove dead particles
    ship.explosionParticles = ship.explosionParticles.filter(p => p.life > 0);
    
    return; // Don't update ship physics when exploded
  }

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

// Render explosion particles
export function drawExplosion(ctx: CanvasRenderingContext2D, ship: Spaceship, offsetX: number, offsetY: number) {
  if (!ship.isExploded) {
    return;
  }
  
  ctx.save();
  
  for (const particle of ship.explosionParticles) {
    const screenX = particle.x + offsetX;
    const screenY = particle.y + offsetY;
    
    // Alpha based on remaining life
    const alpha = particle.life;
    ctx.globalAlpha = alpha;
    
    // Draw particle
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      screenX - particle.size / 2,
      screenY - particle.size / 2,
      particle.size,
      particle.size
    );
  }
  
  ctx.restore();
}
