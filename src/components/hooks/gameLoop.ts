import { useEffect } from 'react';
import { Spaceship } from '../../game/spaceship';
import { Terrain } from '../../game/terrain';
import { handleShipTerrainCollision } from '../../game/collision';
import { updateShip } from '../../game/spaceship';

export interface ShipGameLoopOptions {
  windowSize: { width: number; height: number };
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  lastTimeRef: React.MutableRefObject<number | null>;
  accumulatorRef: React.MutableRefObject<number>;
  prevShipPosRef: React.MutableRefObject<{ x: number; y: number }>;
  shipRef: React.MutableRefObject<Spaceship>;
  keysRef: React.MutableRefObject<{ up: boolean; left: boolean; right: boolean }>;
  terrainRef: React.MutableRefObject<Terrain>;
  starCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  terrainPathRef: React.MutableRefObject<Path2D | null>;
  gradientRef: React.MutableRefObject<CanvasGradient | null>;
  draw: (
    ctx: CanvasRenderingContext2D,
    ship: Spaceship,
    terrain: Terrain,
    renderX: number,
    renderY: number,
    starCanvas: HTMLCanvasElement | null,
    terrainPath: Path2D | null,
    gradient: CanvasGradient | null
  ) => void;
}

/**
 * useShipGameLoop
 * Starts the requestAnimationFrame loop for physics and rendering. Runs once per mount/size change.
 */
export function gameLoop(options: ShipGameLoopOptions) {
  const {
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
  } = options;
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const FIXED_DT = 1 / 120;
    const loop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      let frameDt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      if (frameDt > 0.25) frameDt = 0.25;
      accumulatorRef.current += frameDt;
      while (accumulatorRef.current >= FIXED_DT) {
        prevShipPosRef.current.x = shipRef.current.x;
        prevShipPosRef.current.y = shipRef.current.y;
        updateShip(shipRef.current, FIXED_DT, keysRef.current);
        const collisionResult = handleShipTerrainCollision(shipRef.current, terrainRef.current);
        if (collisionResult.collided && collisionResult.newValues) {
          const { x, y, vx, vy } = collisionResult.newValues;
          shipRef.current.setPositionAndVelocity?.(x, y, vx, vy);
        }
        accumulatorRef.current -= FIXED_DT;
      }
      const alpha = accumulatorRef.current / FIXED_DT;
      const renderX = prevShipPosRef.current.x + (shipRef.current.x - prevShipPosRef.current.x) * alpha;
      const renderY = prevShipPosRef.current.y + (shipRef.current.y - prevShipPosRef.current.y) * alpha;
      draw(
        ctx,
        shipRef.current,
        terrainRef.current,
        renderX,
        renderY,
        starCanvasRef.current,
        terrainPathRef.current,
        gradientRef.current
      );
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [windowSize]);
}
