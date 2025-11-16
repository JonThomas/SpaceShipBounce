# Copilot Instructions

## AI Agent Guidance
- Always check for and follow instructions in `docs/ai-instructions/` for each game part
- If a file exists for a module, use its guidance for code generation
- If unsure, ask for clarification or add a TODO comment

## General instructions
- Prefer typescript files over javascript, and don't mix them
- Don't create new empty files that might be useful in the future

## General Coding Style
- Always use braces `{}` to contain logic within for loops
- Always use braces `{}` for control blocks 
- Add comments for non-trivial logic
- Remove comments that are no longer relevant
- Use descriptive variable names
- Avoid magic numbers; use named constants

## Game-specific
- Physics: Use clear separation of integration, collision, and input
- Rendering: Keep drawing code modular and readable
- Controls: Document key mappings and edge cases