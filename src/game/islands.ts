import { Point, TerrainPolygon } from './terrain';

// Island generation constants
const ISLAND_SEGMENTS = 32; // Fewer segments for islands than main terrain
const ISLAND_NOISE_SCALE = 0.08; // Small radial perturbation for natural look
const NOISE_HARMONIC = 4; // Sine wave frequency for island shape variation
const NOISE_PHASE = 0.5; // Phase offset for shape variation

// Default island positioning constants
const ISLAND_1_X_RATIO = 0.35;
const ISLAND_1_Y_RATIO = 0.35;
const ISLAND_1_WIDTH_RATIO = 0.05;
const ISLAND_1_HEIGHT_RATIO = 0.04;

const ISLAND_2_X_RATIO = 0.65;
const ISLAND_2_Y_RATIO = 0.65;
const ISLAND_2_WIDTH_RATIO = 0.04;
const ISLAND_2_HEIGHT_RATIO = 0.05;

// Generate an island at specified position with given size
export function generateIsland(centerX: number, centerY: number, radiusX: number, radiusY: number): TerrainPolygon {
  const points: Point[] = [];
  for (let i = 0; i < ISLAND_SEGMENTS; i++) {
    const t = i / ISLAND_SEGMENTS;
    const theta = t * Math.PI * 2;
    // Small radial perturbation for natural look
    const radialJitter = 1 + Math.sin(theta * NOISE_HARMONIC + NOISE_PHASE) * ISLAND_NOISE_SCALE;
    const x = centerX + Math.cos(theta) * radiusX * radialJitter;
    const y = centerY + Math.sin(theta) * radiusY * radialJitter;
    points.push({ x, y });
  }
  return { points };
}

// Generate the default set of islands for the game
export function generateDefaultIslands(width: number, height: number): TerrainPolygon[] {
  return [
    // Island 1: Upper left area - positioned safely inside main terrain
    generateIsland(width * ISLAND_1_X_RATIO, height * ISLAND_1_Y_RATIO, width * ISLAND_1_WIDTH_RATIO, height * ISLAND_1_HEIGHT_RATIO),
    // Island 2: Lower right area - positioned safely inside main terrain  
    generateIsland(width * ISLAND_2_X_RATIO, height * ISLAND_2_Y_RATIO, width * ISLAND_2_WIDTH_RATIO, height * ISLAND_2_HEIGHT_RATIO)
  ];
}