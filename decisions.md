// ABOUTME: Records implementation decisions and their rationale for this project.
// ABOUTME: Intended to help contributors understand the "why" behind key choices.

# Implementation Decisions

## Glyph data structure: `{ latex, tMin, tMax }` per stroke

Each glyph maps to an array of stroke objects, not bare strings. This makes the parametric domain explicit and hand-editable alongside the equation it belongs to. It also allows `tMin`/`tMax` to contain `__S__` tokens in case a domain needs to scale with the letter (e.g., a stroke that traces a fixed number of radians could clamp based on scale).

Alternative considered: hardcode `parametricDomain: { min: '0', max: '1' }` in `buildExpressions`. Rejected because it hides the domain from the glyph author and makes non-[0,1] parameterizations awkward to add.

## Token substitution over computed coordinates

Glyphs store `__X__`, `__Y__`, `__S__` tokens rather than functions that accept position/scale. This keeps glyph definitions as inert strings you can read and paste directly into Desmos, verify by eye, and copy back. A function-based approach would be more DRY but would make the glyph data unreadable outside of JS.

## Pure render logic extracted to `src/render.js`

The userscript is a single self-contained file (no imports), but the pure render functions (`substituteTokens`, `buildExpressions`) are duplicated in `src/render.js` for unit testing in Node.js without a browser. This is an intentional trade-off: the PRD requires no build step, so we accept the duplication rather than adding a bundler.

## Fixed-width character grid (CHAR_WIDTH = 0.7)

All characters advance the cursor by `0.7 * scale` regardless of their actual width. This is the simplest approach for v1 and matches the PRD's explicit call for a fixed-width grid. Proportional spacing (a per-character width table) is a fast-follow.

## ID scheme: `txt-{charIndex}-s{strokeIndex}`

Using the character's index in the input string (not the character itself) makes IDs stable across repeated renders of the same text. Using `txt-` prefix guarantees the script can bulk-remove only its own expressions without scanning the full expression list.
