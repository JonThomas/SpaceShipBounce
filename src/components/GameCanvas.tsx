import React, { useEffect, useRef, useState } from 'react';
import { Terrain, generateTerrain } from '../game/terrain';
import { handleWindowSizeChange, RenderAssetsOptions } from './hooks/handleWindowSizeChange';
import { useGameLoop, GameLoopOptions } from './hooks/gameLoop';

// No props needed, will use window size

import { useKeyControls } from './hooks/useKeyControls';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Track window size
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define a much larger world size
  const WORLD_SCALE = 4; // 4x the visible area
  const WORLD_WIDTH = windowSize.width * WORLD_SCALE;
  const WORLD_HEIGHT = windowSize.height * WORLD_SCALE;

  // Initialize ship at center of world
  const terrainRef = useRef<Terrain>(generateTerrain(WORLD_WIDTH, WORLD_HEIGHT));
  const keysRef = useKeyControls();
  const terrainPathRef = useRef<Path2D | null>(null);
  const gradientRef = useRef<CanvasGradient | null>(null);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Prepare static rendering assets when browser window size change
  const renderAssetsOptions: RenderAssetsOptions = {
    windowSize,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    terrainRef,
    canvasRef,
    terrainPathRef,
    gradientRef,
    starCanvasRef
  };
  handleWindowSizeChange(renderAssetsOptions);

  // Start game loop (fixed timestep physics + interpolated rendering) when mounted / size changes.
  const gameLoopOptions: GameLoopOptions = {
    windowSize,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    canvasRef,
    keysRef,
    terrainRef,
    starCanvasRef,
    terrainPathRef,
    gradientRef
  };
  useGameLoop(gameLoopOptions);

  return <canvas
    ref={canvasRef}
    width={windowSize.width}
    height={windowSize.height}
    style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
  />;
};
