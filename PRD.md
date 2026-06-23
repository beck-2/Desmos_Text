# PRD: Desmos Text Renderer (working title)

## One-line summary
A Tampermonkey userscript that runs directly on desmos.com and lets a user type text, which gets rendered as real Desmos equations — one (or more) per glyph — live in the actual expression list and graph, with on-screen controls to reposition and rescale.

## Why this is interesting
The point isn't to display text — it's that the text *is* visibly made of equations. Anyone looking at the expression list sees the curves that spell out the word. This only works if we're driving the real `Calc` object on desmos.com itself, not an embedded copy elsewhere.

## Goals (v1)
- Type a string → it appears in the real Desmos graph, built from real expressions in the real sidebar.
- Charset: `A-Z`, `a-z`, `0-9`.
- Floating control panel injected into the desmos.com page: text input, position (x/y), scale, render/clear.
- Glyph equations stored in a way that's trivial to hand-edit and eyeball-tune (no build step, no compilation).
- Re-rendering on position/scale change shouldn't require retyping the text.
-You can use this desmos link as an example upercase charset: https://www.desmos.com/calculator/h2dm88dq7t and this one as an example lowercase charset: https://www.desmos.com/calculator/mcs03uqty6

## Non-goals (future versions)
- Multiple fonts / font switching
- Filled / solid letters (would use inequalities instead of curves)
- Kerning, proportional spacing, multi-line text
- Packaging as a browser extension
- Mobile/touch support

## Distribution
**Tampermonkey userscript, hosted on a public GitHub repo.**
- One `.user.js` file with standard Tampermonkey metadata block (`@match https://www.desmos.com/calculator*`, `@name`, `@version`, etc.)
- `@downloadURL` / `@updateURL` pointed at the raw GitHub URL so installed copies auto-update when you push changes
- README with install steps: install Tampermonkey → click link to raw `.user.js` on GitHub → Tampermonkey shows install prompt → done
- No build step. The file you edit is the file that runs.

## Architecture

**Single file: `desmos-text.user.js`**, internally organized into clearly marked sections (not separate files, to keep hand-editing friction-free):

1. **GLYPHS section** — a plain JS object mapping each character to one or more LaTeX strings. Each string uses placeholder tokens (`__X__`, `__Y__`, `__S__`) for horizontal offset, vertical offset, and scale, which get substituted with real numbers at render time. Multi-stroke letters (e.g. "A", "k") just have multiple LaTeX strings in their array — each becomes its own Desmos expression.
2. **RENDER logic** — takes `(text, x, y, scale)`, walks the string, looks up each glyph, does token substitution, advances a per-glyph cursor (fixed-width grid for v1 — proportional spacing is a fast-follow), and calls `Calc.setExpressions([...])`.
3. **ID management** — every generated expression gets an id prefixed `txt-` (e.g. `txt-0-stroke1`) so the script can bulk-remove only its own expressions via `Calc.removeExpressions(...)` and never touch anything the user added manually.
4. **Calc detection** — desmos.com loads its calculator asynchronously, so the script polls for `window.Calc` before doing anything.
5. **UI panel** — a small floating `div` injected into the page (fixed position, draggable is a nice-to-have not a requirement for v1) containing:
   - Text input
   - X / Y number inputs
   - Scale number input
   - "Render" button
   - "Clear" button
   Position/scale changes can re-render live (on input); text changes re-render on button click or also live — your call once it's running, easy to flip either way.

## Why placeholder tokens instead of computing literal numbers into the glyph file
Keeping `__X__ / __Y__ / __S__` in the stored glyph LaTeX (rather than baking numbers in) means:
- You can tune a single letter's *shape* once, independent of where it'll be placed
- The substitution step is a dumb string replace — easy to debug by eye, easy to hand-edit
- Repositioning/rescaling never touches glyph definitions, only the substitution inputs

## Open questions to resolve during build (not blocking PRD, but worth flagging)
- Fixed-width glyph grid vs. a simple per-letter width table (width table looks better, barely more work)
- Whether letters render as parametric curves, `y=f(x)` piecewise functions, or point-plots — affects how multi-stroke letters like "A" or "k" are expressed
- Live re-render on every keystroke vs. button-triggered (perf/flicker tradeoff — likely fine either way for <50 chars)

## Milestones
1. Scaffold: Tampermonkey metadata block, `Calc` detection, minimal floating panel, hardcoded render of one test letter
2. Glyph data structure + token-substitution render pipeline, proven on a handful of letters
3. Fill out full `A-Z / a-z / 0-9` set with rough equations (expectation: you'll hand-tune most of these by eye afterward)
4. Wire up live position/scale controls
5. Clear button + id-scoped cleanup
6. README + GitHub publish with auto-update headers

## Repo structure
```
desmos-text-renderer/
├── desmos-text.user.js   (the whole thing — metadata, glyphs, render, UI)
└── README.md             (install instructions, how to add/edit a glyph)
```