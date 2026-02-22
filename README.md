# SpaceShip Bounce

A small React + Vite + TypeScript physics toy: pilot a tiny spacecraft under gravity. Use **Arrow Up** for thrust (in the facing direction), **Arrow Left/Right** to rotate. Terrain generation and collision bouncing will be added.

## Features (current)
- Gravity-based motion
- Thrust and rotation controls
- Simple star field background
- HUD that displays velocity, angle and speed

## Planned
- Parallax multi-layer landscape
- Mobile/touch controls (optional)
- Energy/fuel system (optional)

## Getting Started
```powershell
npm install
npm run dev
```

## TypeScript-Only Policy
This project strictly uses TypeScript only - **NO JavaScript files allowed**.

**Safeguards in place:**
- `tsconfig.json`: `"allowJs": false` and explicit exclusion of `.js/.jsx` files
- `.gitignore`: Prevents JavaScript files from being committed
- Build process will fail if JavaScript files are detected
- Enhanced copilot instructions prevent AI from creating JavaScript files

**If JavaScript files appear:**
```powershell
# Remove all .js files from src directory
Get-ChildItem -Path src -Filter *.js -Recurse | Remove-Item -Force
```

Open the dev server URL (usually http://localhost:5173) in a browser.

Developed and tested with npm version 11.3.0 and node version 24.2.0

## Controls
- Arrow Up: Thrust
- Arrow Left/Right: Rotate

## Development Notes
Physics constants are in `src/game/spaceship.ts`. Terrain generation lives in `src/game/terrain.ts`.