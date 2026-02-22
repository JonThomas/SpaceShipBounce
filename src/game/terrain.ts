export interface Point { x: number; y: number; }
export interface TerrainPolygon { points: Point[]; } // Points define a closed non-self-intersecting polygon (CCW)
export interface Platform {
  p1: Point;  // Start endpoint of the landing surface (on terrain edge)
  p2: Point;  // End endpoint of the landing surface (on terrain edge)
  nx: number; // Normal x pointing into playable area
  ny: number; // Normal y pointing into playable area
}
export interface Terrain { 
  mainTerrain: TerrainPolygon; // The outer boundary terrain
  islands: TerrainPolygon[]; // Array of island polygons within the main terrain
  platforms: Platform[]; // Landing platforms on terrain edges
}

// Main terrain generation constants
const TERRAIN_CENTER_RATIO = 0.5; // Center terrain at middle of world
const TERRAIN_RADIUS_RATIO = 0.35; // Leave margin to canvas edges
const TERRAIN_SEGMENTS = 160; // Higher resolution for smoother boundary
const TERRAIN_NOISE_SCALE_A = 0.15; // Primary noise component
const TERRAIN_NOISE_SCALE_B = 0.07; // Secondary noise component
const TERRAIN_NOISE_FREQ_A = 3; // Primary noise frequency
const TERRAIN_NOISE_FREQ_B = 5; // Secondary noise frequency
const TERRAIN_NOISE_PHASE_B = 1.3; // Phase offset for secondary noise

// Generate main terrain boundary (outer perimeter)
export function generateMainTerrain(width: number, height: number): TerrainPolygon {
  const points: Point[] = [];
  const CENTER_X = width * TERRAIN_CENTER_RATIO;
  const CENTER_Y = height * TERRAIN_CENTER_RATIO;
  const RADIUS_X = width * TERRAIN_RADIUS_RATIO;
  const RADIUS_Y = height * TERRAIN_RADIUS_RATIO;
  
  for (let i = 0; i < TERRAIN_SEGMENTS; i++) {
    const t = i / TERRAIN_SEGMENTS; // [0,1)
    const theta = t * Math.PI * 2;
    // Radial perturbation using sine harmonics (no self intersections if small)
    const radialJitter = 1
      + Math.sin(theta * TERRAIN_NOISE_FREQ_A) * TERRAIN_NOISE_SCALE_A
      + Math.sin(theta * TERRAIN_NOISE_FREQ_B + TERRAIN_NOISE_PHASE_B) * TERRAIN_NOISE_SCALE_B;
    const x = CENTER_X + Math.cos(theta) * RADIUS_X * radialJitter;
    const y = CENTER_Y + Math.sin(theta) * RADIUS_Y * radialJitter;
    points.push({ x, y });
  }
  return { points };
}


