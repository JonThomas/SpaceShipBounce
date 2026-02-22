import { Terrain, generateMainTerrain } from './terrain';
import { generateDefaultIslands } from './islands';
import { generatePlatforms } from './platforms';

// Build complete terrain with main boundary, default islands, and landing platforms
export function buildTerrain(width: number, height: number): Terrain {
  const mainTerrain = generateMainTerrain(width, height);
  const islands = generateDefaultIslands(width, height);

  // Build terrain first, then generate platforms (mutates terrain points to flatten segments)
  const terrain: Terrain = { mainTerrain, islands, platforms: [] };
  terrain.platforms = generatePlatforms(terrain);

  return terrain;
}