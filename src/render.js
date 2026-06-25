// ABOUTME: Pure render logic for Desmos text: token substitution and expression building.
// ABOUTME: This module has no browser dependencies and can be unit-tested in Node.

// Width of each character cell, in scale units. Controls horizontal spacing.
const CHAR_WIDTH = 0.7;
// Vertical distance between baselines for multi-line text, in scale units.
const LINE_HEIGHT = 2.8;

// Replaces __X__, __Y__, __S__ tokens in a LaTeX string with actual numbers.
function substituteTokens(latex, x, y, scale) {
  return latex
    .replace(/__X__/g, String(x))
    .replace(/__Y__/g, String(y))
    .replace(/__S__/g, String(scale));
}

// Converts the expression array from buildExpressions into remove-ready id objects.
function clearExpressionIds(expressions) {
  return expressions.map(e => ({ id: e.id }));
}

// Formats a numeric offset for appending to a variable name in LaTeX.
// offsetTerm('x_{dt}', 0.7) → 'x_{dt}+0.7'
// offsetTerm('x_{dt}', -2.8) → 'x_{dt}-2.8'
// offsetTerm('x_{dt}', 0) → 'x_{dt}'
function offsetTerm(base, offset) {
  const n = parseFloat(offset.toFixed(10));
  if (n === 0) return base;
  if (n < 0) return base + n;   // JS coerces negative number to "-X" string
  return base + '+' + n;
}

// Builds Desmos expression objects for text at a literal position.
// Supports multi-line text via '\n'; each line is offset downward by LINE_HEIGHT * scale.
// glyphs: object mapping char -> array of { latex, tMin, tMax } stroke objects.
function buildExpressions(text, x, y, scale, glyphs) {
  const expressions = [];
  const lines = text.split('\n');
  let globalCharIdx = 0;

  lines.forEach((line, lineIdx) => {
    const lineY = y - lineIdx * LINE_HEIGHT * scale;
    let cursor = x;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const strokes = glyphs[char];

      if (!strokes || strokes.length === 0) {
        cursor += CHAR_WIDTH * scale;
        globalCharIdx++;
        continue;
      }

      strokes.forEach((stroke, j) => {
        const tMin = substituteTokens(stroke.tMin, cursor, lineY, scale);
        const tMax = substituteTokens(stroke.tMax, cursor, lineY, scale);
        const domain = `\\left\\{${tMin}\\le t\\le ${tMax}\\right\\}`;
        expressions.push({
          id: `txt-${globalCharIdx}-s${j}`,
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

// Builds Desmos expression objects for text in draggable mode.
// Instead of literal x/y, expressions reference xVar and yVar (e.g. 'x_{dt}', 'y_{dt}').
// Per-character cursor offsets are still substituted as literal numbers.
// Supports multi-line text via '\n'.
function buildDraggableExpressions(text, scale, glyphs, xVar, yVar) {
  const expressions = [];
  const lines = text.split('\n');
  let globalCharIdx = 0;

  lines.forEach((line, lineIdx) => {
    const yOffset = -lineIdx * LINE_HEIGHT * scale;
    const yTerm = offsetTerm(yVar, yOffset);
    let cursorOffset = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const strokes = glyphs[char];

      if (!strokes || strokes.length === 0) {
        cursorOffset = parseFloat((cursorOffset + CHAR_WIDTH * scale).toFixed(10));
        globalCharIdx++;
        continue;
      }

      const xTerm = offsetTerm(xVar, cursorOffset);

      strokes.forEach((stroke, j) => {
        const latex = stroke.latex
          .replace(/__X__/g, xTerm)
          .replace(/__Y__/g, yTerm)
          .replace(/__S__/g, String(scale));
        const tMin = stroke.tMin.replace(/__S__/g, String(scale));
        const tMax = stroke.tMax.replace(/__S__/g, String(scale));
        const domain = `\\left\\{${tMin}\\le t\\le ${tMax}\\right\\}`;
        expressions.push({
          id: `txt-${globalCharIdx}-s${j}`,
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

module.exports = {
  substituteTokens,
  buildExpressions,
  buildDraggableExpressions,
  clearExpressionIds,
  CHAR_WIDTH,
  LINE_HEIGHT,
};
