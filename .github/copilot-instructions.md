# Copilot Instructions

## AI Agent Guidance
- You may read and update any code required in the spaceshipbounce workarea to complete your tasks
- Always check for and follow instructions in `docs/ai-instructions/` for each game part
- If a file exists for a module, use its guidance for code generation
- When changing the functionality of a module, update the corresponsing instruction file with rationale
- If unsure, ask for clarification or add a TODO comment
- Do not introduce changes that will degrade performance without explicitly asking first if the changes are acceptable

## CRITICAL: TypeScript-Only Policy
- **NEVER create .js or .jsx files under any circumstances**
- **ALWAYS use .ts for TypeScript files and .tsx for React components**
- **IMMEDIATELY delete any .js files if found in the project**
- **Verify no JavaScript files exist before completing any task**
- Use `npm run build` to verify TypeScript compilation works
- If you accidentally create a .js file, delete it immediately and recreate as .ts/.tsx

## General instructions
- Prefer typescript files over javascript, and don't mix them
- Don't create new empty files that might be useful in the future
- Don't maintain any code just for backward compatibility 
- Be firm when making choices: Avoid code that can provide different behaviors by changing the code itself
- Always remove dead code, unused imports, and commented-out code blocks

## General Coding Style
- Always use braces `{}` to contain logic within for loops
- Always use braces `{}` for control blocks 
- Use descriptive variable names
- Avoid magic numbers; use named constants
- Avoid several empty lines in a row

## Comments in code
- Add comments for non-trivial logic
- Remove comments that are no longer relevant

## Game-specific
- Physics: Use clear separation of integration, collision, and input
- Rendering: Keep drawing code modular and readable
- Controls: Document key mappings and edge cases