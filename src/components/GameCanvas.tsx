import React, { useEffect, useRef } from 'react';
import { Spaceship, createInitialShip, updateShip } from '../game/spaceship';
import { Terrain, generateTerrain } from '../game/terrain';

interface GameCanvasProps { width: number; height: number; }

interface KeysState { up: boolean; left: boolean; right: boolean; }

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shipRef = useRef<Spaceship>(createInitialShip(width / 2, height / 4));
  const terrainRef = useRef<Terrain>(generateTerrain(width, height));
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

  updateShip(shipRef.current, dt, keysRef.current, terrainRef.current, ctx.canvas.width, ctx.canvas.height);
      draw(ctx, shipRef.current, terrainRef.current);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

function draw(ctx: CanvasRenderingContext2D, ship: Spaceship, terrain: Terrain) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background stars (simple)
  ctx.save();
  ctx.fillStyle = '#081421';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ffffff22';
  for (let i = 0; i < 120; i++) {
    const x = (i * 73) % ctx.canvas.width;
    const y = (i * 157) % ctx.canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  // Terrain
  ctx.save();
  ctx.strokeStyle = '#3b6b8b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(terrain.points[0].x, terrain.points[0].y);
  for (let i = 1; i < terrain.points.length; i++) {
    ctx.lineTo(terrain.points[i].x, terrain.points[i].y);
  }
  ctx.stroke();
  ctx.restore();

  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.scale(1, 1);

  // Body triangle pointing up (angle 0 means facing up)
  ctx.beginPath();
  ctx.moveTo(0, -12); // nose
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fillStyle = '#cfe2f3';
  ctx.fill();
  ctx.strokeStyle = '#6aa0d3';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Thruster flame when thrusting
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
