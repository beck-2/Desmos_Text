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
      // CW arc from top of circle: center right of top point so tip ends pointing right-upward
      { latex: '(__X__ + __S__ * (0.55 + 0.25 * \\cos(\\pi - \\pi / 3 * t)), __Y__ + __S__ * (1.35 + 0.25 * \\sin(\\pi - \\pi / 3 * t)))', tMin: '0', tMax: '1' },
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
  // Vertical distance between baselines for multi-line text, in scale units.
  const LINE_HEIGHT = 2.8;

  function substituteTokens(str, x, y, scale) {
    return str
      .replace(/__X__/g, String(x))
      .replace(/__Y__/g, String(y))
      .replace(/__S__/g, String(scale));
  }

  // Appends a numeric offset to a base variable name for use in LaTeX.
  // offsetTerm('x_{dt}', 0.7) → 'x_{dt}+0.7'
  // offsetTerm('x_{dt}', -2.8) → 'x_{dt}-2.8'
  // offsetTerm('x_{dt}', 0) → 'x_{dt}'
  function offsetTerm(base, offset) {
    var n = parseFloat(offset.toFixed(10));
    if (n === 0) return base;
    if (n < 0) return base + n;
    return base + '+' + n;
  }

  // Builds literal-position expression objects for the given text.
  // Supports multi-line text via '\n'; each line offsets downward by LINE_HEIGHT * scale.
  function buildExpressions(text, x, y, scale) {
    var expressions = [];
    var lines = text.split('\n');
    var globalCharIdx = 0;

    lines.forEach(function (line, lineIdx) {
      var lineY = y - lineIdx * LINE_HEIGHT * scale;
      var cursor = x;

      for (var i = 0; i < line.length; i++) {
        var char = line[i];
        var strokes = GLYPHS[char];

        if (!strokes || strokes.length === 0) {
          cursor += CHAR_WIDTH * scale;
          globalCharIdx++;
          continue;
        }

        strokes.forEach(function (stroke, j) {
          var tMin = substituteTokens(stroke.tMin, cursor, lineY, scale);
          var tMax = substituteTokens(stroke.tMax, cursor, lineY, scale);
          var domain = '\\left\\{' + tMin + '\\le t\\le ' + tMax + '\\right\\}';
          expressions.push({
            id: 'txt-' + globalCharIdx + '-s' + j,
            type: 'expression',
            latex: substituteTokens(stroke.latex, cursor, lineY, scale) + domain,
          });
        });

        cursor += CHAR_WIDTH * scale;
        globalCharIdx++;
      }
    });

    return expressions;
  }

  // Builds variable-position expression objects using Desmos variable references.
  // xVar/yVar (e.g. 'x_{dt}', 'y_{dt}') replace __X__/__Y__; per-char offsets are literal.
  // Supports multi-line text via '\n'.
  function buildDraggableExpressions(text, scale, xVar, yVar) {
    var expressions = [];
    var lines = text.split('\n');
    var globalCharIdx = 0;

    lines.forEach(function (line, lineIdx) {
      var yOffset = -lineIdx * LINE_HEIGHT * scale;
      var yTerm = offsetTerm(yVar, yOffset);
      var cursorOffset = 0;

      for (var i = 0; i < line.length; i++) {
        var char = line[i];
        var strokes = GLYPHS[char];

        if (!strokes || strokes.length === 0) {
          cursorOffset = parseFloat((cursorOffset + CHAR_WIDTH * scale).toFixed(10));
          globalCharIdx++;
          continue;
        }

        var xTerm = offsetTerm(xVar, cursorOffset);

        strokes.forEach(function (stroke, j) {
          var latex = stroke.latex
            .replace(/__X__/g, xTerm)
            .replace(/__Y__/g, yTerm)
            .replace(/__S__/g, String(scale));
          var tMin = stroke.tMin.replace(/__S__/g, String(scale));
          var tMax = stroke.tMax.replace(/__S__/g, String(scale));
          var domain = '\\left\\{' + tMin + '\\le t\\le ' + tMax + '\\right\\}';
          expressions.push({
            id: 'txt-' + globalCharIdx + '-s' + j,
            type: 'expression',
            latex: latex + domain,
          });
        });

        cursorOffset = parseFloat((cursorOffset + CHAR_WIDTH * scale).toFixed(10));
        globalCharIdx++;
      }
    });

    return expressions;
  }

  // Builds the 4-sided bounding box expression objects (reference x_{dt}/y_{dt}).
  function buildBoundingBox(text, scale) {
    var lines = text.split('\n');
    var numLines = lines.length;
    var maxLen = Math.max.apply(null, lines.map(function (l) { return l.length; }));

    var bL = -0.1 * scale;
    var bR = (maxLen * CHAR_WIDTH + 0.1) * scale;
    var bW = bR - bL;
    var bTop = 2.1 * scale;
    var bBottom = (-0.6 - (numLines - 1) * LINE_HEIGHT) * scale;
    var bH = bTop - bBottom;

    function hLine(yOff, idSuffix) {
      var xTerm = offsetTerm('x_{dt}', bL);
      var yTerm = offsetTerm('y_{dt}', yOff);
      return {
        id: 'dt-bbox-' + idSuffix,
        type: 'expression',
        latex: '(' + xTerm + '+' + bW + 't,' + yTerm + ')\\left\\{0\\le t\\le 1\\right\\}',
      };
    }
    function vLine(xOff, idSuffix) {
      var xTerm = offsetTerm('x_{dt}', xOff);
      var yTerm = offsetTerm('y_{dt}', bBottom);
      return {
        id: 'dt-bbox-' + idSuffix,
        type: 'expression',
        latex: '(' + xTerm + ',' + yTerm + '+' + bH + 't)\\left\\{0\\le t\\le 1\\right\\}',
      };
    }

    return [hLine(bBottom, 'b'), hLine(bTop, 't'), vLine(bL, 'l'), vLine(bR, 'r')];
  }

  // ---------------------------------------------------------------------------
  // SECTION: ID MANAGEMENT AND RENDER
  // ---------------------------------------------------------------------------

  // Tracks draggable-mode state. overlayEl and textParams are set at init / each render.
  var dtState = {
    draggable:   false,
    bboxVisible: false,
    overlayEl:   null,
    textParams:  null,    // {text, scale} used to reposition overlay on zoom/pan
    isDragging:  false,   // true while a mouse drag is in progress
  };

  // Removes txt-* and dt-bbox-* expressions (text strokes and bounding box).
  function clearTextAndBbox(Calc) {
    var stale = Calc.getState().expressions.list
      .filter(function (e) {
        return e.id && (e.id.startsWith('txt-') || e.id.startsWith('dt-bbox-'));
      })
      .map(function (e) { return { id: e.id }; });
    if (stale.length > 0) Calc.removeExpressions(stale);
  }

  // Removes all dt-managed expressions and resets overlay to hidden state.
  function clearAllRendered(Calc) {
    var stale = Calc.getState().expressions.list
      .filter(function (e) {
        return e.id && (e.id.startsWith('txt-') || e.id.startsWith('dt-'));
      })
      .map(function (e) { return { id: e.id }; });
    if (stale.length > 0) Calc.removeExpressions(stale);
    dtState.draggable   = false;
    dtState.bboxVisible = false;
    dtState.textParams  = null;
    if (dtState.overlayEl) {
      dtState.overlayEl.style.pointerEvents = 'none';
      dtState.overlayEl.style.outline = 'none';
    }
  }

  // Reads the current x_{dt}/y_{dt} values from Desmos state (set by dragging).
  function readDraggablePosition(Calc) {
    var list = Calc.getState().expressions.list;
    function parseVal(id) {
      var expr = list.find(function (e) { return e.id === id; });
      if (!expr || !expr.latex) return null;
      var m = expr.latex.match(/=\s*(-?[\d.]+)/);
      return m ? parseFloat(m[1]) : null;
    }
    return { x: parseVal('dt-xvar'), y: parseVal('dt-yvar') };
  }

  // Renders text at a literal position (static mode).
  function renderText(Calc, text, x, y, scale) {
    clearTextAndBbox(Calc);
    if (dtState.draggable) {
      // Exit draggable mode when reverting to literal render
      clearAllRendered(Calc);
    }
    var exprs = buildExpressions(text, x, y, scale);
    if (exprs.length > 0) Calc.setExpressions(exprs);
  }

  // Activates draggable mode: sets Desmos variables, drag point, bounding box, and text.
  // On first call: initialises x_{dt}/y_{dt} from x/y. On subsequent calls (while already
  // in draggable mode): leaves x_{dt}/y_{dt} unchanged so dragged position is preserved.
  function renderDraggable(Calc, text, x, y, scale) {
    clearTextAndBbox(Calc);

    if (!dtState.draggable) {
      Calc.setExpressions([
        { id: 'dt-xvar', type: 'expression', latex: 'x_{dt}=' + x },
        { id: 'dt-yvar', type: 'expression', latex: 'y_{dt}=' + y },
      ]);
      dtState.draggable = true;
    }

    var textExprs = buildDraggableExpressions(text, scale, 'x_{dt}', 'y_{dt}');
    var bboxExprs = buildBoundingBox(text, scale);
    if (textExprs.length > 0 || bboxExprs.length > 0) {
      Calc.setExpressions(textExprs.concat(bboxExprs));
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
          '<textarea id="dt-text" rows="2" placeholder="Hello" style="' + inputStyle() + 'resize:vertical;"></textarea>',
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

  // ---------------------------------------------------------------------------
  // SECTION: DRAG OVERLAY
  // ---------------------------------------------------------------------------

  // Returns viewport-relative bounds of the Desmos graphpaper element.
  // getBoundingClientRect() always gives CSS viewport coords (required for position:fixed).
  // graphpaperBounds.pixelCoordinates can be relative to the graphpaper container, not the
  // viewport, depending on how Desmos lays out its DOM — so we avoid relying on it for origin.
  function getGraphpaperRect() {
    var sels = ['.dcg-graphpaper', '.dcg-graph-outer', '.dcg-grapher'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el.getBoundingClientRect();
    }
    return null;
  }

  // Converts Desmos math coordinates to CSS viewport pixel coordinates.
  function mathToPixel(Calc, mathX, mathY) {
    var b = Calc.graphpaperBounds;
    if (!b) return { x: 0, y: 0 };
    var m = b.mathCoordinates;
    var rect = getGraphpaperRect();
    if (rect) {
      return {
        x: rect.left + (mathX - m.left) / (m.right - m.left) * rect.width,
        y: rect.top  + (m.top - mathY)  / (m.top - m.bottom) * rect.height,
      };
    }
    var p = b.pixelCoordinates;
    return {
      x: p.left + (mathX - m.left) / (m.right - m.left) * (p.right - p.left),
      y: p.top  + (m.top - mathY)  / (m.top - m.bottom) * (p.bottom - p.top),
    };
  }

  // Converts CSS viewport pixel coordinates to Desmos math coordinates.
  function pixelToMath(Calc, px, py) {
    var b = Calc.graphpaperBounds;
    if (!b) return { x: 0, y: 0 };
    var m = b.mathCoordinates;
    var rect = getGraphpaperRect();
    if (rect) {
      return {
        x: m.left + (px - rect.left) / rect.width  * (m.right - m.left),
        y: m.top  - (py - rect.top)  / rect.height * (m.top - m.bottom),
      };
    }
    var p = b.pixelCoordinates;
    return {
      x: m.left + (px - p.left) / (p.right - p.left) * (m.right - m.left),
      y: m.top  - (py - p.top)  / (p.bottom - p.top) * (m.top - m.bottom),
    };
  }

  // Creates (once) a transparent DOM div covering the text bounding box for drag detection.
  function createDragOverlay() {
    if (dtState.overlayEl) return dtState.overlayEl;
    var el = document.createElement('div');
    el.id = 'dt-drag-overlay';
    el.setAttribute('style', [
      'position:fixed',
      'pointer-events:none',
      'z-index:2147483640',
      'box-sizing:border-box',
      'cursor:grab',
    ].join(';'));
    document.documentElement.appendChild(el);
    dtState.overlayEl = el;
    return el;
  }

  // Positions the drag overlay to cover the text bounding box in screen pixels.
  function positionOverlay(Calc, textX, textY, text, scale) {
    var overlay = dtState.overlayEl;
    if (!overlay) return;
    var lines = text.split('\n');
    var maxLen = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var bL = -0.1 * scale;
    var bR = (maxLen * CHAR_WIDTH + 0.1) * scale;
    var bTop    =  2.1 * scale;
    var bBottom = (-0.6 - (lines.length - 1) * LINE_HEIGHT) * scale;
    var tl = mathToPixel(Calc, textX + bL, textY + bTop);
    var br = mathToPixel(Calc, textX + bR, textY + bBottom);
    overlay.style.left   = Math.round(tl.x) + 'px';
    overlay.style.top    = Math.round(tl.y) + 'px';
    overlay.style.width  = Math.round(br.x - tl.x) + 'px';
    overlay.style.height = Math.round(br.y - tl.y) + 'px';
  }

  // Shows or hides the bounding box expressions and overlay border.
  function setBboxVisible(Calc, visible) {
    dtState.bboxVisible = visible;
    var overlay = dtState.overlayEl;
    if (overlay) {
      overlay.style.pointerEvents = visible ? 'auto' : 'none';
      overlay.style.outline       = visible ? '2px dashed rgba(100,200,255,0.75)' : 'none';
    }
    if (visible && dtState.textParams) {
      Calc.setExpressions(buildBoundingBox(dtState.textParams.text, dtState.textParams.scale));
    } else if (!visible) {
      var stale = Calc.getState().expressions.list
        .filter(function (e) { return e.id && e.id.startsWith('dt-bbox-'); })
        .map(function (e) { return { id: e.id }; });
      if (stale.length > 0) Calc.removeExpressions(stale);
    }
  }

  // Wires drag events to the overlay and a double-click listener for bbox re-enable.
  function wireDragOverlay(Calc) {
    var overlay = dtState.overlayEl;
    var dragStart = null;

    overlay.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var startPos = readDraggablePosition(Calc);
      dragStart = {
        startMath: pixelToMath(Calc, e.clientX, e.clientY),
        textX: startPos.x !== null ? startPos.x : 0,
        textY: startPos.y !== null ? startPos.y : 0,
      };
      dtState.isDragging = true;
      overlay.style.cursor = 'grabbing';

      function onMove(ev) {
        if (!dragStart) return;
        var cur = pixelToMath(Calc, ev.clientX, ev.clientY);
        var newX = dragStart.textX + (cur.x - dragStart.startMath.x);
        var newY = dragStart.textY + (cur.y - dragStart.startMath.y);
        Calc.setExpressions([
          { id: 'dt-xvar', type: 'expression', latex: 'x_{dt}=' + newX },
          { id: 'dt-yvar', type: 'expression', latex: 'y_{dt}=' + newY },
        ]);
        if (dtState.textParams) {
          positionOverlay(Calc, newX, newY, dtState.textParams.text, dtState.textParams.scale);
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        dragStart = null;
        dtState.isDragging = false;
        overlay.style.cursor = 'grab';
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

  }

  function wirePanel(Calc) {
    var body = document.getElementById('dt-body');
    var collapseBtn = document.getElementById('dt-collapse');
    var header = document.getElementById('dt-header');
    var collapsed = false;

    function collapse() {
      collapsed = true;
      var titleSpan = document.getElementById('dt-title');
      body.style.display = 'none';
      var panelEl = document.getElementById('dt-panel');
      titleSpan.textContent = 'Desmos Text▸';
      collapseBtn.style.display = 'none';
      header.style.padding = '6px 10px';
      panelEl.style.minWidth = '0';
      panelEl.style.width = 'auto';
      panelEl.style.right = '220px';
      collapseBtn.title = 'Expand';
    }

    function expand() {
      collapsed = false;
      var titleSpan = document.getElementById('dt-title');
      body.style.display = 'flex';
      var panelEl = document.getElementById('dt-panel');
      titleSpan.textContent = 'Desmos Text';
      collapseBtn.style.display = '';
      collapseBtn.textContent = '✕';
      header.style.padding = '10px 14px';
      panelEl.style.minWidth = '220px';
      panelEl.style.width = '';
      panelEl.style.right = '16px';
      collapseBtn.title = 'Collapse';

      // Sync X/Y inputs and re-show bbox when re-opening in draggable mode
      if (dtState.draggable) {
        var pos = readDraggablePosition(Calc);
        if (pos.x !== null) document.getElementById('dt-x').value = pos.x;
        if (pos.y !== null) document.getElementById('dt-y').value = pos.y;
        if (pos.x !== null && dtState.textParams) {
          setBboxVisible(Calc, true);
          positionOverlay(Calc, pos.x, pos.y, dtState.textParams.text, dtState.textParams.scale);
        }
      }
    }

    collapseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (collapsed) expand(); else collapse();
    });

    header.addEventListener('click', function () {
      if (collapsed) expand();
    });

    document.getElementById('dt-clear').addEventListener('click', function () {
      clearAllRendered(Calc);
      document.getElementById('dt-text').value = '';
    });

    // Debounced render on any input change
    var _debounce = null;
    function scheduleRender() {
      clearTimeout(_debounce);
      _debounce = setTimeout(function () {
        var v = getInputValues();
        if (!v.text) {
          clearAllRendered(Calc);
          return;
        }
        if (dtState.draggable) {
          // Update position variables then rebuild text (and bbox if visible)
          Calc.setExpressions([
            { id: 'dt-xvar', type: 'expression', latex: 'x_{dt}=' + v.x },
            { id: 'dt-yvar', type: 'expression', latex: 'y_{dt}=' + v.y },
          ]);
          clearTextAndBbox(Calc);
          var textExprs = buildDraggableExpressions(v.text, v.scale, 'x_{dt}', 'y_{dt}');
          var bboxExprs = dtState.bboxVisible ? buildBoundingBox(v.text, v.scale) : [];
          if (textExprs.length > 0 || bboxExprs.length > 0) {
            Calc.setExpressions(textExprs.concat(bboxExprs));
          }
          dtState.textParams = { text: v.text, scale: v.scale };
          positionOverlay(Calc, v.x, v.y, v.text, v.scale);
        } else {
          renderText(Calc, v.text, v.x, v.y, v.scale);
          // Position overlay even in static mode so double-click detection works
          dtState.textParams = { text: v.text, scale: v.scale };
          positionOverlay(Calc, v.x, v.y, v.text, v.scale);
        }
      }, 150);
    }

    // Enter (no shift) → commit text into draggable mode and collapse panel
    document.getElementById('dt-text').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var v = getInputValues();
        if (v.text) {
          renderDraggable(Calc, v.text, v.x, v.y, v.scale);
          dtState.textParams = { text: v.text, scale: v.scale };
          positionOverlay(Calc, v.x, v.y, v.text, v.scale);
          setBboxVisible(Calc, true);
          collapse();
        }
      }
      // Shift+Enter: allow default newline insertion (textarea handles it natively)
    });

    // Reposition overlay on zoom/pan; skip during active drag to avoid fighting the drag handler
    Calc.observeEvent('change', function () {
      if (dtState.isDragging || !dtState.draggable || !dtState.overlayEl || !dtState.textParams) return;
      var pos = readDraggablePosition(Calc);
      if (pos.x !== null && pos.y !== null) {
        positionOverlay(Calc, pos.x, pos.y, dtState.textParams.text, dtState.textParams.scale);
      }
    });

    // Dismiss bbox when user clicks outside the overlay (mousedown fires before click,
    // so the bbox is already gone before Desmos processes the click).
    document.addEventListener('mousedown', function (e) {
      if (!dtState.bboxVisible || !dtState.overlayEl) return;
      if (e.target === dtState.overlayEl) return;  // clicking inside overlay = drag start, keep bbox
      setBboxVisible(Calc, false);
    }, true);

    // Double-click inside the text area: convert to draggable if needed, then show bbox.
    // Works whether Enter has been pressed or not (static render positions the overlay too).
    document.addEventListener('dblclick', function (e) {
      if (dtState.bboxVisible || !dtState.overlayEl || !dtState.textParams) return;
      var rect = dtState.overlayEl.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top  || e.clientY > rect.bottom) return;
      if (!dtState.draggable) {
        var v = getInputValues();
        renderDraggable(Calc, v.text, v.x, v.y, v.scale);
        dtState.textParams = { text: v.text, scale: v.scale };
        positionOverlay(Calc, v.x, v.y, v.text, v.scale);
        collapse();
      }
      setBboxVisible(Calc, true);
    }, true);

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
    // Remove any txt- or dt- expressions left over from a previous session.
    clearAllRendered(Calc);
    var panel = buildPanel();
    // Append to <html> so Desmos's body mutations can't remove it.
    document.documentElement.appendChild(panel);
    createDragOverlay();
    wirePanel(Calc);
    wireDragOverlay(Calc);
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
