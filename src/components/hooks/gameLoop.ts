import React, { useEffect } from 'react';
import { Spaceship, createInitialShip, drawExplosion } from '../../game/spaceship';
import { Terrain } from '../../game/terrain';
import { handleShipTerrainCollision } from '../../game/collision';
import { updateShip } from '../../game/spaceship';
import { drawHUD } from '../../game/hud';

export interface GameLoopOptions {
  windowSize: { width: number; height: number };
  worldWidth: number;
  worldHeight: number;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  keysRef: React.MutableRefObject<{ up: boolean; left: boolean; right: boolean }>;
  terrainRef: React.MutableRefObject<Terrain>;
  starCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  terrainPathRef: React.MutableRefObject<Path2D | null>;
  gradientRef: React.MutableRefObject<CanvasGradient | null>;
}

/**
 * useGameLoop
 * Starts the requestAnimationFrame loop for physics and rendering. Runs once per mount/size change.
 */
export function useGameLoop(options: GameLoopOptions) {
  const {
    windowSize,
    worldWidth,
    worldHeight,
    canvasRef,
    keysRef,
    terrainRef,
    starCanvasRef,
    terrainPathRef,
    gradientRef,
  } = options;
  // Lazy refs so initialization is clearly one-time and not tied to renders.
  const shipRef = React.useRef<Spaceship | null>(null);
  const prevShipPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const accumulatorRef = React.useRef<number>(0);
  const lastTimeRef = React.useRef<number | null>(null);

  useEffect(() => {
    // Initialize ship once (keeps position stable across window resizes)
    if (!shipRef.current) {
      shipRef.current = createInitialShip(worldWidth * 0.5, worldHeight * 0.5);
      prevShipPosRef.current.x = shipRef.current.x;
      prevShipPosRef.current.y = shipRef.current.y;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !shipRef.current) return;
    const FIXED_DT = 1 / 120;

    function draw(
      ctx: CanvasRenderingContext2D,
      ship: Spaceship,
      renderX: number,
      renderY: number
    ) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (starCanvasRef.current) {
        ctx.drawImage(starCanvasRef.current, 0, 0);
      }
      const offsetX = ctx.canvas.width * 0.5 - renderX;
      const offsetY = ctx.canvas.height * 0.5 - renderY;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      if (terrainPathRef.current) {
        ctx.fillStyle = gradientRef.current || '#1d3b4d';
        ctx.fill(terrainPathRef.current);
        ctx.strokeStyle = '#3b6b8b';
        ctx.lineWidth = 3;
        ctx.stroke(terrainPathRef.current);
      }
      ctx.restore();
      
      // Render ship or explosion
      if (!ship.isExploded) {
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
      } else {
        // Render explosion particles
        drawExplosion(ctx, ship, offsetX, offsetY);
      }
      
      drawHUD(ctx, ship);
    }

    function loop(time: number) {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      let frameDt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      if (frameDt > 0.25) frameDt = 0.25;
      accumulatorRef.current += frameDt;
      while (accumulatorRef.current >= FIXED_DT) {
        const ship = shipRef.current!;
        prevShipPosRef.current.x = ship.x;
        prevShipPosRef.current.y = ship.y;
        updateShip(ship, FIXED_DT, keysRef.current);
        
        // Handle terrain collision (explosion is triggered inside the function)
        handleShipTerrainCollision(ship, terrainRef.current);
        
        // Reset ship after explosion duration (3 seconds)
        if (ship.isExploded && ship.explosionTime >= 3) {
          ship.reset(worldWidth * 0.5, worldHeight * 0.5);
        }
        
        accumulatorRef.current -= FIXED_DT;
      }
      const alpha = accumulatorRef.current / FIXED_DT;
      const ship = shipRef.current!;
      const renderX = prevShipPosRef.current.x + (ship.x - prevShipPosRef.current.x) * alpha;
      const renderY = prevShipPosRef.current.y + (ship.y - prevShipPosRef.current.y) * alpha;
      draw(
        ctx as CanvasRenderingContext2D,
        ship,
        renderX,
        renderY
      );
      requestAnimationFrame(loop);
    }
    let rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [windowSize]);
}
