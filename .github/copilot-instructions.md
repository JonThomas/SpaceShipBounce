# Copilot Instructions

## AI Agent Guidance
- You may read and update any code required in the spaceshipbounce workarea to complete your tasks
- Always check for and follow instructions in `docs/ai-instructions/` for each game part
- If a file exists for a module, use its guidance for code generation
- If unsure, ask for clarification or add a TODO comment

## General instructions
- Prefer typescript files over javascript, and don't mix them
- Don't create new empty files that might be useful in the future

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