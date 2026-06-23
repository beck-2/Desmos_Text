# Journal

## 2026-06-22

Kicked off the project today. Read the PRD and clarified three things: parametric curves (not piecewise), live re-render on position/scale, and beck will hand-type the glyph equations.

Built the scaffolding in this order: unit tests first (TDD), then `src/render.js` to pass them, then the full `desmos-text.user.js`. All 20 unit tests green.

Mid-way through, beck flagged that every stroke needs an explicit domain — not just hardcoded [0,1]. Good catch. Updated the glyph structure from bare strings to `{ latex, tMin, tMax }` objects and threaded `substituteTokens` through the domain bounds too so `__S__` can appear there if needed. Added a test for the `__S__`-in-domain case.

The glyph approximations are rough-by-design (the PRD says so). Every character in A–Z, a–z, 0–9 has at least a plausible parametric curve; beck will tune them by eye in Desmos and paste the LaTeX back in.

Next: hook the script up in Tampermonkey and do a first visual pass. Will need to check whether `parametricDomain` in `setExpressions` is actually honored by the Desmos API — if not, fall back to embedding `\left\{0\le t\le1\right\}` inline.
