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
      // Arc from upper-right (60°) CCW 300° to right side (0°=360°) where bar starts
      { latex: '(__X__ + __S__ * (0.30 + 0.28 * \\cos(\\pi / 3 + 5 * \\pi / 3 * t)), __Y__ + __S__ * (1 + 0.95 * \\sin(\\pi / 3 + 5 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
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
      // Top arc: 270° CCW from 0° (right), excludes lower-right quadrant
      { latex: '(__X__ + __S__ * (0.25 + 0.24 * \\cos(3 * \\pi / 2 * t)), __Y__ + __S__ * (1.5 + 0.50 * \\sin(3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
      // Bottom arc: 270° CCW from π (left), excludes upper-left quadrant
      { latex: '(__X__ + __S__ * (0.25 + 0.24 * \\cos(\\pi + 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.5 + 0.50 * \\sin(\\pi + 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    'T': [
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
    ],

    'U': [
      { latex: '(__X__ + __S__ * 0.05, __Y__ + __S__ * (2 - 1.75 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi + \\pi * t)), __Y__ + __S__ * (0.25 + 0.25 * \\sin(\\pi + \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.55, __Y__ + __S__ * (0.25 + 1.75 * t))', tMin: '0', tMax: '1' },
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
      { latex: '(__X__ + __S__ * (0.22 + 0.20 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.70 + 0.65 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.42, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
    ],

    'b': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.65 + 0.6 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'c': [
      { latex: '(__X__ + __S__ * (0.30 + 0.26 * \\cos(\\pi / 4 + 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.70 + 0.65 * \\sin(\\pi / 4 + 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    'd': [
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.65 + 0.6 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'e': [
      { latex: '(__X__ + __S__ * (0.30 + 0.26 * \\cos(\\pi / 6 + 5 * \\pi / 3 * t)), __Y__ + __S__ * (0.70 + 0.65 * \\sin(\\pi / 6 + 5 * \\pi / 3 * t)))', tMin: '0', tMax: '1' },
      // Crossbar at the height of the arc's upper opening (cy + ry*sin(30°) = 0.70 + 0.325 = 1.025)
      { latex: '(__X__ + __S__ * (0.075 + 0.45 * t), __Y__ + __S__ * 1.025)', tMin: '0', tMax: '1' },
    ],

    'f': [
      { latex: '(__X__ + __S__ * 0.25, __Y__ + __S__ * 1.7 * t)', tMin: '0', tMax: '1' },
      // 180° arc: left end of hook → top → right end
      { latex: '(__X__ + __S__ * (0.35 + 0.1 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (1.7 + 0.2 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.1 + 0.3 * t), __Y__ + __S__ * 0.85)', tMin: '0', tMax: '1' },
    ],

    'g': [
      { latex: '(__X__ + __S__ * (0.28 + 0.24 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.70 + 0.60 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      // Vertical from right side of circle (x=0.52, y=0.70) down to descender
      { latex: '(__X__ + __S__ * 0.52, __Y__ + __S__ * (0.70 - 1.10 * t))', tMin: '0', tMax: '1' },
      // CW half-circle hook curving down then left from bottom of vertical
      { latex: '(__X__ + __S__ * (0.32 + 0.20 * \\cos(-\\pi * t)), __Y__ + __S__ * (-0.4 + 0.20 * \\sin(-\\pi * t)))', tMin: '0', tMax: '1' },
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
      { latex: '(__X__ + __S__ * 0.35, __Y__ + __S__ * (1.35 - 1.75 * t))', tMin: '0', tMax: '1' },
      // CW half-circle hook — same r=0.20 and y=-0.40 as g hook
      { latex: '(__X__ + __S__ * (0.15 + 0.20 * \\cos(-\\pi * t)), __Y__ + __S__ * (-0.40 + 0.20 * \\sin(-\\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.35 + 0.05 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.6 + 0.05 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    'k': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.08 + 0.4 * t), __Y__ + __S__ * (0.85 + 0.5 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.08 + 0.4 * t), __Y__ + __S__ * (0.85 - 0.85 * t))', tMin: '0', tMax: '1' },
    ],

    'l': [
      { latex: '(__X__ + __S__ * 0.25, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    'm': [
      // Shifted left by 0.05 vs original to reduce gap with next character
      { latex: '(__X__ + __S__ * 0.0, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.15 + 0.15 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.3, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.45 + 0.15 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.6, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
    ],

    'n': [
      { latex: '(__X__ + __S__ * 0.08, __Y__ + __S__ * 1.35 * t)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.28 + 0.2 * \\cos(\\pi - \\pi * t)), __Y__ + __S__ * (0.75 + 0.6 * \\sin(\\pi - \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.48, __Y__ + __S__ * 0.75 * t)', tMin: '0', tMax: '1' },
    ],

    'o': [
      { latex: '(__X__ + __S__ * (0.28 + 0.26 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.68 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
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
      // Top arc: 270° CCW from 0°, excludes lower-right quadrant
      { latex: '(__X__ + __S__ * (0.08 + 0.26 * \\cos(3 * \\pi / 2 * t)), __Y__ + __S__ * (0.93 + 0.30 * \\sin(3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
      // Bottom arc: 270° CCW from π, excludes upper-left quadrant
      { latex: '(__X__ + __S__ * (0.08 + 0.26 * \\cos(\\pi + 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.33 + 0.30 * \\sin(\\pi + 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
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
      // Upper arc: from upper-left (120°) CW 210° to bottom-center, connecting to lower arc
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(2 * \\pi / 3 - 7 * \\pi / 6 * t)), __Y__ + __S__ * (1.5 + 0.5 * \\sin(2 * \\pi / 3 - 7 * \\pi / 6 * t)))', tMin: '0', tMax: '1' },
      // Lower arc: from bottom-center CW 210° to lower-left
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(\\pi / 2 - 7 * \\pi / 6 * t)), __Y__ + __S__ * (0.5 + 0.5 * \\sin(\\pi / 2 - 7 * \\pi / 6 * t)))', tMin: '0', tMax: '1' },
    ],

    '4': [
      { latex: '(__X__ + __S__ * (0.4 - 0.35 * t), __Y__ + __S__ * (2 - 1.1 * t))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.05 + 0.5 * t), __Y__ + __S__ * 0.9)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * 0.4, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    ],

    '5': [
      { latex: '(__X__ + __S__ * (0.55 - 0.48 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      // Vertical down to the shelf height (top of arc)
      { latex: '(__X__ + __S__ * 0.07, __Y__ + __S__ * (2 - 0.70 * t))', tMin: '0', tMax: '1' },
      // Horizontal shelf connecting vertical to top of arc
      { latex: '(__X__ + __S__ * (0.07 + 0.23 * t), __Y__ + __S__ * 1.30)', tMin: '0', tMax: '1' },
      // Arc from top (90°) CW 270° to left (180°); top at (0.30, 1.30), left at (0.07, 0.65)
      { latex: '(__X__ + __S__ * (0.30 + 0.23 * \\cos(\\pi / 2 - 3 * \\pi / 2 * t)), __Y__ + __S__ * (0.65 + 0.65 * \\sin(\\pi / 2 - 3 * \\pi / 2 * t)))', tMin: '0', tMax: '1' },
    ],

    '6': [
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.7 + 0.65 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      // CW arc: center (0.45,1.15) below the arc gives concave-down shape going right and up
      { latex: '(__X__ + __S__ * (0.45 + 0.25 * \\cos(2.21 - 1.1 * t)), __Y__ + __S__ * (1.15 + 0.25 * \\sin(2.21 - 1.1 * t)))', tMin: '0', tMax: '1' },
    ],

    '7': [
      { latex: '(__X__ + __S__ * (0.07 + 0.46 * t), __Y__ + __S__ * 2)', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.53 - 0.33 * t), __Y__ + __S__ * (2 - 2 * t))', tMin: '0', tMax: '1' },
    ],

    '8': [
      // Upper circle; tangent to lower circle at y=1.02 (cy_upper - ry_upper = cy_lower + ry_lower)
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.50 + 0.48 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      { latex: '(__X__ + __S__ * (0.3 + 0.25 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (0.50 + 0.52 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
    ],

    '9': [
      { latex: '(__X__ + __S__ * (0.3 + 0.23 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1.35 + 0.62 * \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
      // Vertical tail from the rightmost point of the circle (tangent = vertical there)
      { latex: '(__X__ + __S__ * 0.53, __Y__ + __S__ * (1.35 - 1.35 * t))', tMin: '0', tMax: '1' },
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

  // Scans Calc state for any txt- expressions and removes them.
  // Using getState() instead of an in-memory list means stale expressions
  // from a previous page session are also caught.
  function clearRendered(Calc) {
    var stale = Calc.getState().expressions.list
      .filter(function (e) { return e.id && e.id.startsWith('txt-'); })
      .map(function (e) { return { id: e.id }; });
    if (stale.length > 0) {
      Calc.removeExpressions(stale);
    }
  }

  function renderText(Calc, text, x, y, scale) {
    clearRendered(Calc);
    var exprs = buildExpressions(text, x, y, scale);
    if (exprs.length > 0) {
      Calc.setExpressions(exprs);
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION: UI PANEL
  // ---------------------------------------------------------------------------

  function buildPanel() {
    var panel = document.createElement('div');
    panel.id = 'dt-panel';
    panel.setAttribute('style', [
      'position:fixed !important',
      'top:16px !important',
      'right:16px !important',
      'z-index:2147483647 !important',
      'display:flex !important',
      'flex-direction:column !important',
      'background:#1e1e2e',
      'color:#cdd6f4',
      'border:1px solid #45475a',
      'border-radius:8px',
      'font-family:monospace',
      'font-size:13px',
      'min-width:220px',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
    ].join(';'));

    var closeBtn = [
      'background:none',
      'border:none',
      'color:#cdd6f4',
      'font-size:14px',
      'cursor:pointer',
      'padding:0',
      'line-height:1',
    ].join(';');

    panel.innerHTML = [
      // Header row — always visible; click when collapsed to expand
      '<div id="dt-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;">',
        '<span id="dt-title" style="font-weight:bold;font-size:14px;">Desmos Text</span>',
        '<button id="dt-collapse" style="' + closeBtn + '" title="Collapse">✕</button>',
      '</div>',
      // Body — hidden when collapsed
      '<div id="dt-body" style="display:flex;flex-direction:column;gap:8px;padding:0 14px 12px;">',
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
      'background:' + color,
      'color:#1e1e2e',
      'border:none',
      'border-radius:4px',
      'padding:6px 0',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'cursor:pointer',
      'width:100%',
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
    var body = document.getElementById('dt-body');
    var collapseBtn = document.getElementById('dt-collapse');
    var header = document.getElementById('dt-header');
    var collapsed = false;

    function toggleCollapse() {
      collapsed = !collapsed;
      var titleSpan = document.getElementById('dt-title');
      body.style.display = collapsed ? 'none' : 'flex';
      var panelEl = document.getElementById('dt-panel');
      if (collapsed) {
        titleSpan.textContent = 'Desmos Text▸';
        collapseBtn.style.display = 'none';
        header.style.padding = '6px 10px';
        panelEl.style.minWidth = '0';
        panelEl.style.width = 'auto';
        panelEl.style.right = '120px';
      } else {
        titleSpan.textContent = 'Desmos Text';
        collapseBtn.style.display = '';
        collapseBtn.textContent = '✕';
        header.style.padding = '10px 14px';
        panelEl.style.minWidth = '220px';
        panelEl.style.width = '';
        panelEl.style.right = '16px';
      }
      collapseBtn.title = collapsed ? 'Expand' : 'Collapse';
    }

    collapseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCollapse();
    });

    // Click the header to expand when collapsed
    header.addEventListener('click', function () {
      if (collapsed) toggleCollapse();
    });

    document.getElementById('dt-clear').addEventListener('click', function () {
      clearRendered(Calc);
      document.getElementById('dt-text').value = '';
    });

    // Auto-render on text input (debounced) and on position/scale changes
    var _debounce = null;
    function scheduleRender() {
      clearTimeout(_debounce);
      _debounce = setTimeout(function () {
        var v = getInputValues();
        if (v.text) {
          renderText(Calc, v.text, v.x, v.y, v.scale);
        } else {
          clearRendered(Calc);
        }
      }, 150);
    }

    document.getElementById('dt-text').addEventListener('input', scheduleRender);
    ['dt-x', 'dt-y', 'dt-scale'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', scheduleRender);
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION: CALC DETECTION
  // ---------------------------------------------------------------------------

  function init() {
    if (document.getElementById('dt-panel')) return;
    var Calc = unsafeWindow.Calc;
    // Remove any txt- expressions left over from a previous session.
    clearRendered(Calc);
    var panel = buildPanel();
    // Append to <html> so Desmos's body mutations can't remove it.
    document.documentElement.appendChild(panel);
    wirePanel(Calc);
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
