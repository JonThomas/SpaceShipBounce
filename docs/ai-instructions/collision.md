# Collision Detection Instructions

## Purpose
The collision module handles all collision detection logic for the spaceship bouncer game. This module was separated from terrain generation to maintain clear separation of concerns per copilot-instructions.md.

## Key Functions

### Core Collision Detection
- `pointOutsidePolygon()` - Fast polygon containment test with bounding box optimization
- `pointOutsideTerrain()` - Checks if point is outside main terrain or inside islands
- `isCollidingWithTerrain()` - Main collision test for spaceship against terrain

### Geometry Utilities
- `segmentNormal()` - Computes outward normal vectors for polygon segments
- `closestSegmentInfo()` - Finds closest terrain segment for collision response

### Safe Positioning
- `findSafeSpawnPosition()` - Locates collision-free spawn points for spaceship

## Performance Optimizations
- Bounding box checks before expensive ray-casting
- Early termination in terrain checks
- Efficient segment distance calculations

## Integration
- Used by spaceship collision handling
- Required for spawn position determination
- Maintains terrain type imports for data structures only
- Platform landing: `findNearestPlatform` checks if collision is with a platform segment,
  `canLandOnPlatform` verifies speed and angle thresholds before allowing a safe landing
  instead of triggering an explosion

## Rationale for Module Separation
Moved collision logic from terrain.ts to collision.ts to:
- Follow single responsibility principle
- Improve code organization and maintainability  
- Separate terrain generation from collision detection concerns
- Enable future collision optimizations without affecting terrain code
- Remove dead code (sampleTerrainHeight stub function)