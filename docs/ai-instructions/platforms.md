# Platforms Module

## Purpose
Platforms are safe landing zones on terrain edges. Unlike regular terrain that causes the spaceship to explode on contact, a platform allows the ship to land and rest if the approach is slow and the ship is oriented roughly upright relative to the platform's surface normal.

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
- `canLandOnPlatform(ship, platform)` — verifies:
  - Speed ≤ 50 px/s (`LANDING_MAX_SPEED`)
  - Ship nose aligned with platform normal (dot product > 0.85 ≈ 32°)
- `handleShipTerrainCollision` checks platforms before exploding:
  - On platform + conditions met → land (freeze ship, snap to surface)
  - On platform + conditions not met → explode
  - Not on platform → explode

## Ship Landed State (`src/game/spaceship.ts`)
- `isLanded`, `landedNx`, `landedNy` fields on `Spaceship`
- When landed: physics frozen (no gravity, no drift), ship stays in place
- Takeoff: pressing thrust applies an 80 px/s impulse along the stored platform normal

## Rendering (`src/game/platforms.ts`)
- `drawPlatforms(ctx, platforms)` — draws rectangular pads (dark fill `#1a3a1a`, green border `#39ff14`)
- Pads are extruded 8px from the terrain edge along the inward normal
- Called from the game loop inside the terrain transform context

## HUD (`src/game/hud.ts`)
- Green "LANDED" text displayed when `ship.isLanded` is true

## Constants
| Constant | Value | Location |
|---|---|---|
| LANDING_MAX_SPEED | 50 px/s | collision.ts |
| LANDING_ANGLE_THRESHOLD | 0.85 (~32°) | collision.ts |
| TAKEOFF_IMPULSE | 80 px/s | spaceship.ts |
| PLATFORM_PAD_THICKNESS | 8 px | platforms.ts |
