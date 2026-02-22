# Platforms Module

## Purpose
Platforms are safe landing zones on terrain edges. Unlike regular terrain that causes the spaceship to explode on contact, a platform allows the ship to land and rest if the approach is slow and the ship is oriented roughly upright relative to the platform's surface normal.

## Agreed Requirements
- Landing is safe only when impact speed is <= 8% of ship max speed.
- Landing is safe only when ship angle is within ±5° of platform perpendicular.
- Visual cue checks both speed and angle together (binary safe/unsafe state).
- Cue only reacts when close to a platform, controlled by a named proximity constant using ship-center to platform-center distance.

## Data Model (`src/game/terrain.ts`)
- `Platform` interface with `p1`, `p2` (endpoints on the terrain edge), `nx`, `ny` (inward normal)
- `Terrain.platforms: Platform[]` — platforms are part of the terrain data

## Generation (`src/game/platforms.ts`)
- `generatePlatforms(terrain)` — creates 3 platforms by flattening specific terrain polygon segments
  - Platform 1: Bottom of main terrain boundary (segments 38–42)
  - Platform 2: Left side of main terrain boundary (segments 78–82)
  - Platform 3: Top of island 1 (segments 22–26)
- Flattening mutates the terrain polygon points in-place so collision geometry matches the visual
- Normals are inverted for main terrain platforms (outward → inward) but kept as-is for island platforms

## Collision & Landing (`src/game/collision.ts`)
- `findNearestPlatform(x, y, radius, platforms)` — checks if the ship is within collision distance of any platform
- `canLandOnPlatform(ship, platform, graceFactor?)` — verifies:
  - Speed ≤ LANDING_SPEED_RATIO × ship.maxSpeed × graceFactor (0.24 × 500 = 120 px/s; collision uses 1.15× grace)
  - Ship nose within ±LANDING_ANGLE_TOLERANCE_DEG (15°) of platform normal
- `applyLandingAssists(ship, platforms, dt)` — gentle assists when near a platform:
  - Rotational nudge toward platform normal (within 60px)
  - Speed braking to reduce approach speed (within 40px)
  - Only applies on the correct side of the platform
- `isShipNearPlatform(ship, platform)` — proximity check for visual cue activation
- `handleShipTerrainCollision` checks platforms before exploding:
  - On platform + conditions met → land (freeze ship, snap to surface)
  - On platform + conditions not met → explode
  - Not on platform → explode

## Ship Landed State (`src/game/spaceship.ts`)
- `isLanded`, `landedNx`, `landedNy` fields on `Spaceship`
- When landed: physics frozen (no gravity, no drift), ship stays in place
- Takeoff: pressing thrust applies an 80 px/s impulse along the stored platform normal

## Rendering (`src/game/platforms.ts`)
- `drawPlatforms(ctx, platforms, ship)` — now requires the ship for proximity/safety checks
- Pads are extruded 8px from the terrain edge along the inward normal
- Called from the game loop inside the terrain transform context
- Visual cue: when ship is within LANDING_PROXIMITY_DISTANCE of a platform center and not landed/exploded,
  the platform border switches from static green to dynamic: green (#39ff14) if safe to land, red (#ff3333) if not

## HUD (`src/game/hud.ts`)
- Green "LANDED" text displayed when `ship.isLanded` is true

## Constants
| Constant | Value | Location |
|---|---|---|
| LANDING_SPEED_RATIO | 0.24 (24%) | collision.ts |
| LANDING_ANGLE_TOLERANCE_DEG | 15° | collision.ts |
| LANDING_PROXIMITY_DISTANCE | 200 px | collision.ts |
| LANDING_COLLISION_GRACE | 1.15 | collision.ts |
| ASSIST_RANGE | 60 px | collision.ts |
| ROTATION_ASSIST_RATE | 0.8 rad/s | collision.ts |
| BRAKE_RANGE | 40 px | collision.ts |
| BRAKE_FACTOR | 0.3 | collision.ts |
| TAKEOFF_IMPULSE | 80 px/s | spaceship.ts |
| PLATFORM_PAD_THICKNESS | 8 px | platforms.ts |
| PLATFORM_SAFE_COLOR | #39ff14 | platforms.ts |
| PLATFORM_UNSAFE_COLOR | #ff3333 | platforms.ts |
