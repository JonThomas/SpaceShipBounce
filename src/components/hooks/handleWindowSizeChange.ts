import { useEffect } from 'react';
import { Terrain } from '../../game/terrain';

export interface RenderAssetsOptions {
  windowSize: { width: number; height: number };
  worldWidth: number;
  worldHeight: number;
  terrainRef: React.MutableRefObject<Terrain>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  terrainPathsRef: React.MutableRefObject<Path2D[]>; // Array of paths: [mainTerrain, ...islands]
  gradientRef: React.MutableRefObject<CanvasGradient | null>;
  starCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

/**
 * Prepares terrain path, gradient, and starfield canvas when window size or world dimensions change.
 */
export function handleWindowSizeChange(options: RenderAssetsOptions) {
  const { windowSize, worldWidth, worldHeight, terrainRef, canvasRef, terrainPathsRef, gradientRef, starCanvasRef } = options;
  useEffect(() => {
    // Generate paths for all terrain polygons
    const paths: Path2D[] = [];
    const terrain = terrainRef.current;
    
    // Main terrain path
    const mainPath = new Path2D();
    if (terrain.mainTerrain.points.length > 0) {
      mainPath.moveTo(terrain.mainTerrain.points[0].x, terrain.mainTerrain.points[0].y);
      for (let i = 1; i < terrain.mainTerrain.points.length; i++) {
        mainPath.lineTo(terrain.mainTerrain.points[i].x, terrain.mainTerrain.points[i].y);
      }
      mainPath.closePath();
    }
    paths.push(mainPath);
    
    // Island paths
    for (const island of terrain.islands) {
      const islandPath = new Path2D();
      if (island.points.length > 0) {
        islandPath.moveTo(island.points[0].x, island.points[0].y);
        for (let i = 1; i < island.points.length; i++) {
          islandPath.lineTo(island.points[i].x, island.points[i].y);
        }
        islandPath.closePath();
      }
      paths.push(islandPath);
    }
    
    terrainPathsRef.current = paths;
    // Starfield prerender
    const starCanvas = document.createElement('canvas');
    starCanvas.width = windowSize.width;
    starCanvas.height = windowSize.height;
    const sctx = starCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#081421';
      sctx.fillRect(0, 0, starCanvas.width, starCanvas.height);
      sctx.fillStyle = '#ffffff22';
      const STAR_COUNT = 120;
      const STAR_X_FACTOR = 73;
      const STAR_Y_FACTOR = 157;
      for (let starIndex = 0; starIndex < STAR_COUNT; starIndex++) {
        const starX = (starIndex * STAR_X_FACTOR) % starCanvas.width;
        const starY = (starIndex * STAR_Y_FACTOR) % starCanvas.height;
        sctx.fillRect(starX, starY, 2, 2);
      }
    }
    starCanvasRef.current = starCanvas;
    // Gradient cache (created against visible canvas height)
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      grad.addColorStop(0, '#1d3b4d');
      grad.addColorStop(1, '#0b1e29');
      gradientRef.current = grad;
    }
  }, [windowSize, worldWidth, worldHeight]);
}
