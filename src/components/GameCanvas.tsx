import React, { useEffect, useRef, useState } from 'react';
import { Spaceship, createInitialShip, updateShip } from '../game/spaceship';
import { Terrain, generateTerrain } from '../game/terrain';
import { drawHUD } from '../game/hud';
import { handleWindowSizeChange, RenderAssetsOptions } from './hooks/handleWindowSizeChange';
import { gameLoop, ShipGameLoopOptions } from './hooks/gameLoop';

// No props needed, will use window size

interface KeysState { up: boolean; left: boolean; right: boolean; }

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
  const shipRef = useRef<Spaceship>(createInitialShip(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5));
  const terrainRef = useRef<Terrain>(generateTerrain(WORLD_WIDTH, WORLD_HEIGHT));
  const keysRef = useRef<KeysState>({ up: false, left: false, right: false });
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);
  const prevShipPosRef = useRef<{x:number;y:number}>({ x: shipRef.current.x, y: shipRef.current.y });
  const terrainPathRef = useRef<Path2D | null>(null);
  const gradientRef = useRef<CanvasGradient | null>(null);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') keysRef.current.up = true;
      if (e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'ArrowRight') keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') keysRef.current.up = false;
      if (e.code === 'ArrowLeft') keysRef.current.left = false;
      if (e.code === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
  const gameLoopOptions: ShipGameLoopOptions = {
    windowSize,
    canvasRef,
    lastTimeRef,
    accumulatorRef,
    prevShipPosRef,
    shipRef,
    keysRef,
    terrainRef,
    starCanvasRef,
    terrainPathRef,
    gradientRef,
    draw
  };
  gameLoop(gameLoopOptions);

  return <canvas
    ref={canvasRef}
    width={windowSize.width}
    height={windowSize.height}
    style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
  />;
};


function draw(
  ctx: CanvasRenderingContext2D,
  ship: Spaceship,
  terrain: Terrain,
  renderX: number,
  renderY: number,
  starCanvas: HTMLCanvasElement | null,
  terrainPath: Path2D | null,
  gradient: CanvasGradient | null
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Starfield prerender
  // (We rely on starCanvasRef via closure; TypeScript allows any here)
  if (starCanvas) {
    ctx.drawImage(starCanvas, 0, 0);
  }
  // Offset for terrain based on interpolated position
  const offsetX = ctx.canvas.width * 0.5 - renderX;
  const offsetY = ctx.canvas.height * 0.5 - renderY;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  if (terrainPath) {
    ctx.fillStyle = gradient || '#1d3b4d';
    ctx.fill(terrainPath);
    ctx.strokeStyle = '#3b6b8b';
    ctx.lineWidth = 3;
    ctx.stroke(terrainPath);
  }
  ctx.restore();
  // Ship (centered on screen with its own rotation)
  ctx.save();
  ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fillStyle = '#cfe2f3';
  ctx.fill();
  ctx.strokeStyle = '#6aa0d3';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (ship.shouldRenderFlame?.()) {
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(4, 22);
    ctx.lineTo(0, 18);
    ctx.lineTo(-4, 22);
    ctx.closePath();
    ctx.fillStyle = '#ff9f1c';
    ctx.fill();
  }
  ctx.restore();
  drawHUD(ctx, ship);
}
