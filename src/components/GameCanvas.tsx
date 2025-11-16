import React, { useEffect, useRef } from 'react';
import { Spaceship, createInitialShip, updateShip } from '../game/spaceship';
import { Terrain, generateTerrain } from '../game/terrain';

interface GameCanvasProps { width: number; height: number; }

interface KeysState { up: boolean; left: boolean; right: boolean; }

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Define a much larger world size
  const WORLD_SCALE = 4; // 4x the visible area
  const WORLD_WIDTH = width * WORLD_SCALE;
  const WORLD_HEIGHT = height * WORLD_SCALE;

  // Initialize ship at center of world
  const shipRef = useRef<Spaceship>(createInitialShip(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5));
  const terrainRef = useRef<Terrain>(generateTerrain(WORLD_WIDTH, WORLD_HEIGHT));
  const keysRef = useRef<KeysState>({ up: false, left: false, right: false });
  const lastTimeRef = useRef<number | null>(null);

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

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      updateShip(shipRef.current, dt, keysRef.current, terrainRef.current, WORLD_WIDTH, WORLD_HEIGHT);
      draw(ctx, shipRef.current, terrainRef.current, WORLD_WIDTH, WORLD_HEIGHT);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} />;
};


function draw(ctx: CanvasRenderingContext2D, ship: Spaceship, terrain: Terrain, worldWidth: number, worldHeight: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background stars (simple)
  ctx.save();
  ctx.fillStyle = '#081421';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ffffff22';
  // Draw background stars
  const STAR_COUNT = 120;
  const STAR_X_FACTOR = 73;
  const STAR_Y_FACTOR = 157;
  for (let starIndex = 0; starIndex < STAR_COUNT; starIndex++) {
    const starX = (starIndex * STAR_X_FACTOR) % ctx.canvas.width;
    const starY = (starIndex * STAR_Y_FACTOR) % ctx.canvas.height;
    ctx.fillRect(starX, starY, 2, 2);
  }
  ctx.restore();

  // Calculate offset so ship is always in center of canvas
  const offsetX = ctx.canvas.width * 0.5 - ship.x;
  const offsetY = ctx.canvas.height * 0.5 - ship.y;

  // Terrain
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(terrain.points[0].x + offsetX, terrain.points[0].y + offsetY);
  for (let terrainIndex = 1; terrainIndex < terrain.points.length; terrainIndex++) {
    ctx.lineTo(terrain.points[terrainIndex].x + offsetX, terrain.points[terrainIndex].y + offsetY);
  }
  ctx.closePath();
  // Fill with gradient
  const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  grad.addColorStop(0, '#1d3b4d');
  grad.addColorStop(1, '#0b1e29');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#3b6b8b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Ship (always in center)
  ctx.save();
  ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
  ctx.rotate(ship.angle);
  ctx.scale(1, 1);

  // Body triangle pointing up (angle 0 means facing up)
  ctx.beginPath();
  
  // Draw ship triangle (nose, right, left)
  ctx.moveTo(0, -12); // nose
  ctx.lineTo(8, 10); // right
  ctx.lineTo(-8, 10); // left
  ctx.closePath();
  ctx.fillStyle = '#cfe2f3';
  ctx.fill();
  ctx.strokeStyle = '#6aa0d3';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw thruster flame if thrusting
  if (ship.thrusting) {
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

  // Simple HUD
  ctx.save();
  ctx.fillStyle = '#b8ccd9';
  ctx.font = '14px monospace';
  ctx.fillText(`Vel: ${ship.vx.toFixed(2)}, ${ship.vy.toFixed(2)}`, 10, 20);
  ctx.fillText(`Angle: ${(ship.angle * 180 / Math.PI).toFixed(1)}°`, 10, 40);
  ctx.restore();
}
