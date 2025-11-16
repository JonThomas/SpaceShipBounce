# HUD Instructions

- Keep all HUD-related canvas rendering in `src/game/hud.ts` via `drawHUD(ctx, ship)`.
- HUD displays: velocity components, angle (degrees), and speed bar.
- Speed bar: horizontal bar sized by `speed / ship.maxSpeed`.
- Speed bar color interpolates from red (#ff0000) at 0 speed to thrust flame color (#ff9f1c) at max speed.
- Speed bar label shows only the word `Speed` (no numeric values).
- Use ship's `maxSpeed` for scaling; do not hardcode alternative limits.
- Keep text legible: monospace 12–14px, light color `#b8ccd9` over dark background.
- Avoid overlapping gameplay area indicators. Position HUD near top-left by default.
- Any new metrics (fuel, damage, etc.) should be added here—keep GameCanvas free of HUD specifics.
- Document non-trivial visual logic with comments.
