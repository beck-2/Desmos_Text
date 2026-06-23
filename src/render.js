// ABOUTME: Pure render logic for Desmos text: token substitution and expression building.
// ABOUTME: This module has no browser dependencies and can be unit-tested in Node.

// Width of each character cell, in scale units. Controls horizontal spacing.
const CHAR_WIDTH = 0.7;

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

// Builds the Desmos expression objects for a text string at the given position and scale.
// glyphs: object mapping char -> array of LaTeX strings with __X__/__Y__/__S__ tokens.
// Returns an array of expression objects ready for Calc.setExpressions / Calc.removeExpressions.
function buildExpressions(text, x, y, scale, glyphs) {
  const expressions = [];
  let cursor = x;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const strokes = glyphs[char];

    if (!strokes || strokes.length === 0) {
      // Unknown char: advance cursor and move on
      cursor += CHAR_WIDTH * scale;
      continue;
    }

    strokes.forEach((stroke, j) => {
      const tMin = substituteTokens(stroke.tMin, cursor, y, scale);
      const tMax = substituteTokens(stroke.tMax, cursor, y, scale);
      const domain = `\\left\\{${tMin}\\le t\\le ${tMax}\\right\\}`;
      expressions.push({
        id: `txt-${i}-s${j}`,
        type: 'expression',
        latex: substituteTokens(stroke.latex, cursor, y, scale) + domain,
      });
    });

    cursor += CHAR_WIDTH * scale;
  }

  return expressions;
}

module.exports = { substituteTokens, buildExpressions, clearExpressionIds, CHAR_WIDTH };
