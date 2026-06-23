// ABOUTME: Tampermonkey userscript that renders text as real Desmos parametric curve expressions.
// ABOUTME: Inject into desmos.com/calculator — provides a floating panel to type, position, and scale text.

// ==UserScript==
// @name         Desmos Text Renderer
// @namespace    https://github.com/beck-2/Desmos_Text
// @version      1.0.0
// @description  Render text as parametric curve equations directly in the Desmos graph
// @author       beck-2
// @match        https://www.desmos.com/calculator*
// @grant        unsafeWindow
// @downloadURL  https://raw.githubusercontent.com/beck-2/Desmos_Text/main/desmos-text.user.js
// @updateURL    https://raw.githubusercontent.com/beck-2/Desmos_Text/main/desmos-text.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // SECTION: GLYPHS
  //
  // Each character maps to an array of stroke objects: { latex, tMin, tMax }
  //
  //   latex  — parametric curve LaTeX string; may contain:
  //              __X__  left edge of character cell (Desmos x-units)
  //              __Y__  baseline of character (Desmos y-units)
  //              __S__  scale factor
  //   tMin   — lower bound of parameter t; may contain __S__
  //   tMax   — upper bound of parameter t; may contain __S__
  //
  // All three strings go through token substitution at render time.
  //
  // Coordinate conventions (normalized, before __S__ scaling):
  //   Uppercase / digits: x ∈ [0, 0.6], y ∈ [0, 2]  (baseline = 0, cap = 2)
  //   Lowercase:          x ∈ [0, 0.6], y ∈ [−0.5, 1.35]
  // ---------------------------------------------------------------------------

  const GLYPHS = {

    // ── UPPERCASE ────────────────────────────────────────────────────────────

    'A': [
      { latex: '(__X__ + __S__ * 0.3 * t, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.6 - 0.3 * t), __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.3 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
    ],

    'B': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.3 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.35 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (0.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'C': [
      { latex: '(__X__ + __S__ * (0.3 + 0.28 * \\cos(\\pi / 3 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (1 + \\sin(\\pi / 3 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
    ],

    'D': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (1 + \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'E': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.4 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    'F': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.4 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
    ],

    'G': [
      { latex: '(__X__ + __S__ * (0.3 + 0.28 * \\cos(\\pi / 3 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (1 + \\sin(\\pi / 3 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.58 - 0.28 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
    ],

    'H': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.55, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
    ],

    'I': [
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.3 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.3 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    'J': [
      { latex: '(__X__ + __S__ * 0.4, __Y__ + __S__ * (0.3 + 1.7 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.25 * \\cos(-\\pi / 2 * t)), __Y__ + __S__ * (0.3 + 0.25 * \\sin(-\\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    'K': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * (1 + t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * (1 - t))', tMin: '0', tMax: '1' },
    ],

    'L': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    'M': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.25 * t), __Y__ + __S__ * (2 - 1.2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * t), __Y__ + __S__ * (0.8 + 1.2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.55, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
    ],

    'N': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.55, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    'O': [
      { latex: '(__X__ + __S__ * (0.3 + 0.27 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1 + \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'P': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.38 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'Q': [
      { latex: '(__X__ + __S__ * (0.3 + 0.27 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1 + \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.35 + 0.25 * t), __Y__ + __S__ * (0.4 - 0.4 * t))', tMin: '0', tMax: '1' },
    ],

    'R': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.38 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.25 + 0.3 * t), __Y__ + __S__ * (1 - t))', tMin: '0', tMax: '1' },
    ],

    'S': [
      { latex: '(__X__ + __S__ * (0.3 + 0.22 * \\cos(-\\pi / 6 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (1.5 + 0.4 * \\sin(-\\pi / 6 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.22 * \\cos(5 * \\pi / 6 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (0.5 + 0.4 * \\sin(5 * \\pi / 6 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
    ],

    'T': [
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
    ],

    'U': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 1.6 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi + \\pi * t)), __Y__ + __S__ * (0.4 + 0.25 * \\sin(\\pi + \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.55, __Y__ + __S__ * (0.4 + 1.6 * t))', tMin: '0', tMax: '1' },
    ],

    'V': [
      { latex: '(__X__ + __S__ * (0.05 + 0.25 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.55 - 0.25 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
    ],

    'W': [
      { latex: '(__X__ + __S__ * (0.05 + 0.13 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.18 + 0.12 * t), __Y__ + __S__ * 1.2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.12 * t), __Y__ + __S__ * (1.2 - 1.2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.42 + 0.13 * t), __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    'X': [
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.55 - 0.5 * t), __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    'Y': [
      { latex: '(__X__ + __S__ * (0.05 + 0.25 * t), __Y__ + __S__ * (2 - t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.55 - 0.25 * t), __Y__ + __S__ * (2 - t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * t)', tMin: '0', tMax: '1' },
    ],

    'Z': [
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.55 - 0.5 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    // ── LOWERCASE ────────────────────────────────────────────────────────────
    // x-height ≈ 1.35; ascenders reach 2.0; descenders reach −0.5

    'a': [
      { latex: '(__X__ + __S__ * (0.22 + 0.18 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.7 + 0.65 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.4, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
    ],

    'b': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.65 + 0.6 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'c': [
      { latex: '(__X__ + __S__ * (0.3 + 0.22 * \\cos(\\pi / 4 + 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.7 + 0.65 * \\sin(\\pi / 4 + 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    'd': [
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.65 + 0.6 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'e': [
      { latex: '(__X__ + __S__ * (0.3 + 0.22 * \\cos(\\pi / 6 + 5 * \\pi / 3 * t)), __Y__ + __S__ * (0.7 + 0.65 * \\sin(\\pi / 6 + 5 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.08 + 0.44 * t), __Y__ + __S__ * 0.7)', tMin: '0', tMax: '1' },
    ],

    'f': [
      { latex: '(__X__ + __S__ * 0.25, __Y__ + __S__ * 1.8 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.35 + 0.1 * \\cos(\\pi - \\pi / 2 * t)), __Y__ + __S__ * (1.9 + 0.15 * \\sin(\\pi - \\pi / 2 * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.1 + 0.3 * t), __Y__ + __S__ * 0.85)', tMin: '0', tMax: '1' },
    ],

    'g': [
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.7 + 0.6 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * (1.3 - 1.7 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.48 - 0.3 * t), __Y__ - __S__ * 0.4)', tMin: '0', tMax: '1' },
    ],

    'h': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.85 + 0.5 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 0.85 * t)', tMin: '0', tMax: '1' },
    ],

    'i': [
      { latex: '(__X__ + __S__ * 0.25, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.25 + 0.05 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.6 + 0.05 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'j': [
      { latex: '(__X__ + __S__ * 0.35, __Y__ + __S__ * (1.35 - 1.7 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.35 - 0.25 * t), __Y__ - __S__ * 0.35)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.35 + 0.05 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.6 + 0.05 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'k': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.08 + 0.4 * t), __Y__ + __S__ * (0.85 + 0.5 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.08 + 0.4 * t), __Y__ + __S__ * (0.85 - 0.85 * t))', tMin: '0', tMax: '1' },
    ],

    'l': [
      { latex: '(__X__ + __S__ * 0.25, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.2 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    'm': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.2 + 0.15 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.35, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.5 + 0.15 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.65, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
    ],

    'n': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
    ],

    'o': [
      { latex: '(__X__ + __S__ * (0.28 + 0.22 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.68 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'p': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * (-0.5 + 1.85 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.68 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'q': [
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * (-0.5 + 1.85 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.68 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'r': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(\\pi - \\pi / 2 * t)), __Y__ + __S__ * (0.85 + 0.5 * \\sin(\\pi - \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    's': [
      { latex: '(__X__ + __S__ * (0.28 + 0.18 * \\cos(-\\pi / 6 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (1.0 + 0.3 * \\sin(-\\pi / 6 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.18 * \\cos(5 * \\pi / 6 + 4 * \\pi / 3 * t)), __Y__ + __S__ * (0.4 + 0.3 * \\sin(5 * \\pi / 6 + 4 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
    ],

    't': [
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * 1.8 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.1 + 0.4 * t), __Y__ + __S__ * 0.9)', tMin: '0', tMax: '1' },
    ],

    'u': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * (1.35 - 0.95 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(\\pi + \\pi * t)), __Y__ + __S__ * (0.4 + 0.35 * \\sin(\\pi + \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
    ],

    'v': [
      { latex: '(__X__ + __S__ * (0.05 + 0.23 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.5 - 0.22 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
    ],

    'w': [
      { latex: '(__X__ + __S__ * (0.03 + 0.13 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.16 + 0.11 * t), __Y__ + __S__ * 0.9 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.27 + 0.11 * t), __Y__ + __S__ * (0.9 - 0.9 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.38 + 0.15 * t), __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
    ],

    'x': [
      { latex: '(__X__ + __S__ * (0.05 + 0.45 * t), __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.5 - 0.45 * t), __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
    ],

    'y': [
      { latex: '(__X__ + __S__ * (0.05 + 0.23 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.5 - 0.38 * t), __Y__ + __S__ * (1.35 - 1.85 * t))', tMin: '0', tMax: '1' },
    ],

    'z': [
      { latex: '(__X__ + __S__ * (0.07 + 0.42 * t), __Y__ + __S__ * 1.35)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.49 - 0.42 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.07 + 0.42 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    // ── DIGITS ───────────────────────────────────────────────────────────────

    '0': [
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1 + 0.95 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    '1': [
      { latex: '(__X__ + __S__ * 0.35, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.2 + 0.15 * t), __Y__ + __S__ * (1.8 + 0.2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.2 + 0.3 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    '2': [
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.55 - 0.5 * t), __Y__ + __S__ * (1.5 - 1.5 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__)', tMin: '0', tMax: '1' },
    ],

    '3': [
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi / 2 - \\pi * t)), __Y__ + __S__ * (0.5 + 0.5 * \\sin(\\pi / 2 - \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    '4': [
      { latex: '(__X__ + __S__ * (0.4 - 0.35 * t), __Y__ + __S__ * (2 - 1.1 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 0.9)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.4, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    '5': [
      { latex: '(__X__ + __S__ * (0.55 - 0.48 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.07, __Y__ + __S__ * (2 - t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(\\pi - 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.65 + 0.65 * \\sin(\\pi - 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    '6': [
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.7 + 0.65 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.2 * t), __Y__ + __S__ * (1.35 + 0.65 * t))', tMin: '0', tMax: '1' },
    ],

    '7': [
      { latex: '(__X__ + __S__ * (0.07 + 0.46 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.53 - 0.33 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
    ],

    '8': [
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.5 + 0.48 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.55 + 0.52 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    '9': [
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.35 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.53 - 0.18 * t), __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
    ],

  };

  // ---------------------------------------------------------------------------
  // SECTION: RENDER LOGIC
  // Mirror of src/render.js (pure functions, no DOM or Calc dependencies).
  // ---------------------------------------------------------------------------

  const CHAR_WIDTH = 0.7;

  function substituteTokens(str, x, y, scale) {
    return str
      .replace(/__X__/g, String(x))
      .replace(/__Y__/g, String(y))
      .replace(/__S__/g, String(scale));
  }

  function buildExpressions(text, x, y, scale) {
    const expressions = [];
    let cursor = x;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const strokes = GLYPHS[char];

      if (!strokes || strokes.length === 0) {
        cursor += CHAR_WIDTH * scale;
        continue;
      }

      strokes.forEach(function (stroke, j) {
        var tMin = substituteTokens(stroke.tMin, cursor, y, scale);
        var tMax = substituteTokens(stroke.tMax, cursor, y, scale);
        var domain = '\\left\\{' + tMin + '\\le t\\le ' + tMax + '\\right\\}';
        expressions.push({
          id: 'txt-' + i + '-s' + j,
          type: 'expression',
          latex: substituteTokens(stroke.latex, cursor, y, scale) + domain,
        });
      });

      cursor += CHAR_WIDTH * scale;
    }

    return expressions;
  }

  // ---------------------------------------------------------------------------
  // SECTION: ID MANAGEMENT
  // ---------------------------------------------------------------------------

  let _currentIds = [];

  function clearRendered(Calc) {
    if (_currentIds.length > 0) {
      Calc.removeExpressions(_currentIds.map(function (id) { return { id: id }; }));
      _currentIds = [];
    }
  }

  function renderText(Calc, text, x, y, scale) {
    clearRendered(Calc);
    const exprs = buildExpressions(text, x, y, scale);
    if (exprs.length > 0) {
      Calc.setExpressions(exprs);
      _currentIds = exprs.map(function (e) { return e.id; });
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION: UI PANEL
  // ---------------------------------------------------------------------------

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'dt-panel';
    // Use !important on layout-critical properties so Desmos CSS can't override them.
    panel.setAttribute('style', [
      'position:fixed !important',
      'top:16px !important',
      'right:16px !important',
      'z-index:2147483647 !important',
      'display:flex !important',
      'flex-direction:column !important',
      'gap:8px',
      'background:#1e1e2e',
      'color:#cdd6f4',
      'border:1px solid #45475a',
      'border-radius:8px',
      'padding:12px 14px',
      'font-family:monospace',
      'font-size:13px',
      'min-width:220px',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
    ].join(';'));

    panel.innerHTML = [
      '<div style="font-weight:bold;font-size:14px;margin-bottom:2px;">Desmos Text</div>',
      '<label style="display:flex;flex-direction:column;gap:2px;">',
        'Text',
        '<input id="dt-text" type="text" placeholder="Hello" style="' + inputStyle() + '" />',
      '</label>',
      '<div style="display:flex;gap:6px;">',
        '<label style="flex:1;display:flex;flex-direction:column;gap:2px;">X',
          '<input id="dt-x" type="number" value="0" step="0.1" style="' + inputStyle() + '" />',
        '</label>',
        '<label style="flex:1;display:flex;flex-direction:column;gap:2px;">Y',
          '<input id="dt-y" type="number" value="0" step="0.1" style="' + inputStyle() + '" />',
        '</label>',
      '</div>',
      '<label style="display:flex;flex-direction:column;gap:2px;">',
        'Scale',
        '<input id="dt-scale" type="number" value="1" step="0.1" min="0.01" style="' + inputStyle() + '" />',
      '</label>',
      '<div style="display:flex;gap:6px;margin-top:2px;">',
        '<button id="dt-render" style="' + btnStyle('#89b4fa') + '">Render</button>',
        '<button id="dt-clear" style="' + btnStyle('#f38ba8') + '">Clear</button>',
      '</div>',
    ].join('');

    return panel;
  }

  function inputStyle() {
    return [
      'background:#313244',
      'color:#cdd6f4',
      'border:1px solid #45475a',
      'border-radius:4px',
      'padding:4px 6px',
      'font-family:monospace',
      'font-size:13px',
      'width:100%',
      'box-sizing:border-box',
    ].join(';');
  }

  function btnStyle(color) {
    return [
      'flex:1',
      'background:' + color,
      'color:#1e1e2e',
      'border:none',
      'border-radius:4px',
      'padding:6px 0',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'cursor:pointer',
    ].join(';');
  }

  function getInputValues() {
    return {
      text:  document.getElementById('dt-text').value,
      x:     parseFloat(document.getElementById('dt-x').value) || 0,
      y:     parseFloat(document.getElementById('dt-y').value) || 0,
      scale: parseFloat(document.getElementById('dt-scale').value) || 1,
    };
  }

  function wirePanel(Calc) {
    document.getElementById('dt-render').addEventListener('click', function () {
      var v = getInputValues();
      renderText(Calc, v.text, v.x, v.y, v.scale);
    });

    document.getElementById('dt-clear').addEventListener('click', function () {
      clearRendered(Calc);
    });

    // Live re-render when position/scale change, but only if text is already rendered
    ['dt-x', 'dt-y', 'dt-scale'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        if (_currentIds.length > 0) {
          var v = getInputValues();
          renderText(Calc, v.text, v.x, v.y, v.scale);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION: CALC DETECTION
  // ---------------------------------------------------------------------------

  function init() {
    if (document.getElementById('dt-panel')) return;
    var panel = buildPanel();
    // Append to <html> so Desmos's body mutations can't remove it.
    document.documentElement.appendChild(panel);
    wirePanel(unsafeWindow.Calc);
    console.log('[DesmosText] panel injected');
  }

  var pollInterval = setInterval(function () {
    if (unsafeWindow.Calc && typeof unsafeWindow.Calc.setExpressions === 'function') {
      clearInterval(pollInterval);
      console.log('[DesmosText] Calc detected, injecting panel');
      init();
    }
  }, 300);

})();
