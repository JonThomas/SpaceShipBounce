import { Spaceship } from './spaceship';

// Draws heads-up display including velocity, angle, and a speed bar.
// Keep HUD rendering isolated from core game rendering logic.
export function drawHUD(ctx: CanvasRenderingContext2D, ship: Spaceship) {
  const padding = 10;
  ctx.save();
  ctx.font = '14px monospace';
  ctx.fillStyle = '#b8ccd9';

  // Velocity text
  ctx.fillText(`Vel: ${ship.vx.toFixed(2)}, ${ship.vy.toFixed(2)}`, padding, 20);
  // Angle text
  ctx.fillText(`Angle: ${(ship.angle * 180 / Math.PI).toFixed(1)}°`, padding, 40);

  // Speed bar chart (single horizontal bar representing current speed magnitude relative to maxSpeed)
  // Use cached speed from ship to avoid repeated hypot calculations.
  const ratio = Math.min(1, ship.currentSpeed / ship.maxSpeed);
  const barX = padding;
  const barY = 60;
  const barWidth = 160;
  const barHeight = 14;

  // Bar background
  ctx.fillStyle = '#2c4352';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Filled portion with dynamic color from red (#ff0000) to flame (#ff9f1c)
  const filledWidth = barWidth * ratio;
  const speedBarColorRed = 255; // constant
  const speedBarColorGreen = Math.round(159 * ratio);
  const speedBarColorBlue = Math.round(28 * ratio);
  ctx.fillStyle = `rgb(${speedBarColorRed},${speedBarColorGreen},${speedBarColorBlue})`;
  ctx.fillRect(barX, barY, filledWidth, barHeight);

  // Border
  ctx.strokeStyle = '#6aa0d3';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Speed label
  ctx.fillStyle = '#b8ccd9';
  ctx.font = '12px monospace';
  ctx.fillText('Speed', barX + 4, barY + barHeight - 3);

  ctx.restore();
}