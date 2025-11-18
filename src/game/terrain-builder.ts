import { Terrain, generateMainTerrain } from './terrain';
import { generateDefaultIslands } from './islands';

// Build complete terrain with main boundary and default islands
export function buildTerrain(width: number, height: number): Terrain {
  const mainTerrain = generateMainTerrain(width, height);
  const islands = generateDefaultIslands(width, height);
  
  return { mainTerrain, islands };
}