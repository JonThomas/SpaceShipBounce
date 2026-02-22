import { Point, TerrainPolygon, Terrain, Platform } from './terrain';

// Platform segment indices on main terrain (160 segments, CCW)
// Bottom area: theta ≈ π/2 at i=40
const MAIN_PLATFORM_1_START = 38;
const MAIN_PLATFORM_1_END = 42;
// Left area: theta ≈ π at i=80
const MAIN_PLATFORM_2_START = 78;
const MAIN_PLATFORM_2_END = 82;

// Platform segment indices on island 1 (32 segments, CCW)
// Top area: theta ≈ 3π/2 at i=24
const ISLAND_1_PLATFORM_START = 22;
const ISLAND_1_PLATFORM_END = 26;

// Rendering constants
const PLATFORM_PAD_THICKNESS = 8;
const PLATFORM_FILL_COLOR = '#1a3a1a';
const PLATFORM_BORDER_COLOR = '#39ff14';
const PLATFORM_BORDER_WIDTH = 2;

// Compute outward normal for a segment (same formula as collision.ts, duplicated to avoid circular import)
function computeNormal(a: Point, b: Point): { nx: number; ny: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let nx = dy;
  let ny = -dx;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;
  return { nx, ny };
}

// Flatten polygon points in a range onto the straight line from start to end
function flattenSegments(polygon: TerrainPolygon, startIdx: number, endIdx: number): { p1: Point; p2: Point } {
  const p1 = polygon.points[startIdx];
  const p2 = polygon.points[endIdx];
  for (let i = startIdx + 1; i < endIdx; i++) {
    const t = (i - startIdx) / (endIdx - startIdx);
    polygon.points[i].x = p1.x + (p2.x - p1.x) * t;
    polygon.points[i].y = p1.y + (p2.y - p1.y) * t;
  }
  return { p1, p2 };
}

// Create a platform by flattening a segment range on a terrain polygon.
// invertNormal: true for main terrain (outward normal points away from playable area)
function createPlatform(polygon: TerrainPolygon, startIdx: number, endIdx: number, invertNormal: boolean): Platform {
  const { p1, p2 } = flattenSegments(polygon, startIdx, endIdx);
  const { nx, ny } = computeNormal(p1, p2);
  const sign = invertNormal ? -1 : 1;
  return { p1, p2, nx: nx * sign, ny: ny * sign };
}

// Generate platforms on the existing terrain by flattening specific edge segments.
// Must be called after terrain generation since it mutates terrain polygon points.
export function generatePlatforms(terrain: Terrain): Platform[] {
  const platforms: Platform[] = [];

  // Platform 1: Bottom of main terrain boundary
  platforms.push(createPlatform(terrain.mainTerrain, MAIN_PLATFORM_1_START, MAIN_PLATFORM_1_END, true));

  // Platform 2: Left side of main terrain boundary
  platforms.push(createPlatform(terrain.mainTerrain, MAIN_PLATFORM_2_START, MAIN_PLATFORM_2_END, true));

  // Platform 3: Top of island 1
  if (terrain.islands.length > 0) {
    platforms.push(createPlatform(terrain.islands[0], ISLAND_1_PLATFORM_START, ISLAND_1_PLATFORM_END, false));
  }

  return platforms;
}

// Draw platform pads as filled rectangles extruded from the terrain edge into the playable area
export function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
  for (const platform of platforms) {
    const { p1, p2, nx, ny } = platform;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x + nx * PLATFORM_PAD_THICKNESS, p2.y + ny * PLATFORM_PAD_THICKNESS);
    ctx.lineTo(p1.x + nx * PLATFORM_PAD_THICKNESS, p1.y + ny * PLATFORM_PAD_THICKNESS);
    ctx.closePath();

    ctx.fillStyle = PLATFORM_FILL_COLOR;
    ctx.fill();
    ctx.strokeStyle = PLATFORM_BORDER_COLOR;
    ctx.lineWidth = PLATFORM_BORDER_WIDTH;
    ctx.stroke();
  }
}
