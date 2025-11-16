import { useEffect } from 'react';
import { Terrain } from '../../game/terrain';

export interface RenderAssetsOptions {
  windowSize: { width: number; height: number };
  worldWidth: number;
  worldHeight: number;
  terrainRef: React.MutableRefObject<Terrain>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  terrainPathRef: React.MutableRefObject<Path2D | null>;
  gradientRef: React.MutableRefObject<CanvasGradient | null>;
  starCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

/**
 * useRenderAssets
 * Prepares terrain path, gradient, and starfield canvas when window size or world dimensions change.
 */
export function handleWindowSizeChange(options: RenderAssetsOptions) {
  const { windowSize, worldWidth, worldHeight, terrainRef, canvasRef, terrainPathRef, gradientRef, starCanvasRef } = options;
  useEffect(() => {
    // Terrain path
    const path = new Path2D();
    const terrain = terrainRef.current;
    if (terrain.points.length > 0) {
      path.moveTo(terrain.points[0].x, terrain.points[0].y);
      for (let i = 1; i < terrain.points.length; i++) {
        path.lineTo(terrain.points[i].x, terrain.points[i].y);
      }
      path.closePath();
    }
    terrainPathRef.current = path;
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
