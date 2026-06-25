// ABOUTME: Unit tests for the pure render logic in src/render.js
// ABOUTME: Tests token substitution, expression building, and ID management

const {
  substituteTokens,
  buildExpressions,
  buildDraggableExpressions,
  clearExpressionIds,
  CHAR_WIDTH,
  LINE_HEIGHT,
} = require('../src/render');

// Each stroke is { latex, tMin, tMax }. tMin/tMax may contain __S__ tokens.
const SAMPLE_GLYPHS = {
  'A': [
    { latex: '(__X__ + __S__ * 0.3 * t, __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    { latex: '(__X__ + __S__ * (0.6 - 0.3 * t), __Y__ + __S__ * 2 * t)', tMin: '0', tMax: '1' },
    { latex: '(__X__ + __S__ * (0.15 + 0.3 * t), __Y__ + __S__ * 1)', tMin: '0', tMax: '1' },
  ],
  'O': [
    { latex: '(__X__ + __S__ * (0.3 + 0.3 * \\cos(2 * \\pi * t)), __Y__ + __S__ * (1 + \\sin(2 * \\pi * t)))', tMin: '0', tMax: '1' },
  ],
};

describe('substituteTokens', () => {
  test('replaces __X__, __Y__, __S__ with numeric values', () => {
    const latex = '(__X__ + __S__ * t, __Y__ + __S__ * 2t)';
    const result = substituteTokens(latex, 1, 2, 0.5);
    expect(result).toBe('(1 + 0.5 * t, 2 + 0.5 * 2t)');
  });

  test('replaces all occurrences of each token', () => {
    const latex = '(__X__ + __S__ * \\cos(t), __Y__ + __S__ * \\sin(t))';
    const result = substituteTokens(latex, 0, 0, 2);
    expect(result).toBe('(0 + 2 * \\cos(t), 0 + 2 * \\sin(t))');
  });

  test('handles zero values', () => {
    const latex = '(__X__, __Y__, __S__)';
    expect(substituteTokens(latex, 0, 0, 0)).toBe('(0, 0, 0)');
  });

  test('handles negative offsets', () => {
    const latex = '(__X__ + __S__ * t, __Y__)';
    const result = substituteTokens(latex, -3, -1.5, 1);
    expect(result).toBe('(-3 + 1 * t, -1.5)');
  });

  test('handles decimal scale', () => {
    const latex = '(__S__ * t, __S__ * 2t)';
    const result = substituteTokens(latex, 0, 0, 0.25);
    expect(result).toBe('(0.25 * t, 0.25 * 2t)');
  });
});

describe('buildExpressions', () => {
  test('returns empty array for empty string', () => {
    expect(buildExpressions('', 0, 0, 1, SAMPLE_GLYPHS)).toEqual([]);
  });

  test('returns empty array for string with no known glyphs', () => {
    expect(buildExpressions('?', 0, 0, 1, SAMPLE_GLYPHS)).toEqual([]);
  });

  test('returns one expression per stroke for a single char', () => {
    const exprs = buildExpressions('O', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs).toHaveLength(1);
  });

  test('multi-stroke char produces correct number of expressions', () => {
    const exprs = buildExpressions('A', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs).toHaveLength(3);
  });

  test('expression IDs are prefixed with txt-', () => {
    const exprs = buildExpressions('A', 0, 0, 1, SAMPLE_GLYPHS);
    exprs.forEach(e => expect(e.id).toMatch(/^txt-/));
  });

  test('expression IDs encode char index and stroke index', () => {
    const exprs = buildExpressions('A', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs[0].id).toBe('txt-0-s0');
    expect(exprs[1].id).toBe('txt-0-s1');
    expect(exprs[2].id).toBe('txt-0-s2');
  });

  test('two-character string produces correct IDs', () => {
    const exprs = buildExpressions('OA', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs[0].id).toBe('txt-0-s0');
    expect(exprs[1].id).toBe('txt-1-s0');
    expect(exprs[2].id).toBe('txt-1-s1');
    expect(exprs[3].id).toBe('txt-1-s2');
  });

  test('each expression has type expression', () => {
    const exprs = buildExpressions('O', 0, 0, 1, SAMPLE_GLYPHS);
    exprs.forEach(e => expect(e.type).toBe('expression'));
  });

  test('domain restriction is embedded inline in the latex', () => {
    const exprs = buildExpressions('O', 0, 0, 1, SAMPLE_GLYPHS);
    exprs.forEach(e => {
      expect(e.latex).toContain('\\left\\{0\\le t\\le 1\\right\\}');
      expect(e).not.toHaveProperty('parametricDomain');
    });
  });

  test('tMin and tMax are token-substituted when they contain __S__', () => {
    const scaledGlyphs = {
      'Z': [
        { latex: '(t, t)', tMin: '0', tMax: '__S__ * 2' },
      ],
    };
    const exprs = buildExpressions('Z', 0, 0, 3, scaledGlyphs);
    expect(exprs[0].latex).toContain('\\left\\{0\\le t\\le 3 * 2\\right\\}');
  });

  test('second char is offset by CHAR_WIDTH * scale', () => {
    const exprs = buildExpressions('OO', 0, 0, 1, SAMPLE_GLYPHS);
    const firstLatex = exprs[0].latex;
    const secondLatex = exprs[1].latex;
    const expectedX2 = CHAR_WIDTH * 1;
    expect(secondLatex).toContain(String(expectedX2));
    expect(firstLatex).toContain('0 +');
  });

  test('tokens are substituted in latex output', () => {
    const exprs = buildExpressions('O', 5, 3, 2, SAMPLE_GLYPHS);
    expect(exprs[0].latex).not.toContain('__X__');
    expect(exprs[0].latex).not.toContain('__Y__');
    expect(exprs[0].latex).not.toContain('__S__');
  });

  test('skips unknown characters silently', () => {
    // '!' not in SAMPLE_GLYPHS; 'A' is
    const exprs = buildExpressions('!A', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs).toHaveLength(3);
    // char index 1 because '!' was index 0 (skipped)
    expect(exprs[0].id).toBe('txt-1-s0');
  });

  test('newline splits text into separate lines', () => {
    const exprs = buildExpressions('O\nO', 0, 0, 1, SAMPLE_GLYPHS);
    expect(exprs).toHaveLength(2);
  });

  test('second line is offset downward by LINE_HEIGHT * scale', () => {
    const exprs = buildExpressions('O\nO', 0, 0, 1, SAMPLE_GLYPHS);
    // First O uses y=0, second uses y = 0 - LINE_HEIGHT*1 = -LINE_HEIGHT
    expect(exprs[0].latex).not.toContain(String(-LINE_HEIGHT));
    expect(exprs[1].latex).toContain(String(-LINE_HEIGHT));
  });

  test('char IDs are unique across lines', () => {
    const exprs = buildExpressions('A\nA', 0, 0, 1, SAMPLE_GLYPHS);
    const ids = exprs.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('multi-line scale applies to both line offset and per-char scale', () => {
    const exprs = buildExpressions('O\nO', 0, 0, 2, SAMPLE_GLYPHS);
    const expectedY = -(LINE_HEIGHT * 2);
    expect(exprs[1].latex).toContain(String(expectedY));
  });
});

describe('buildDraggableExpressions', () => {
  test('replaces __X__ with xVar', () => {
    const exprs = buildDraggableExpressions('O', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[0].latex).toContain('x_{dt}');
    expect(exprs[0].latex).not.toContain('__X__');
  });

  test('replaces __Y__ with yVar', () => {
    const exprs = buildDraggableExpressions('O', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[0].latex).toContain('y_{dt}');
    expect(exprs[0].latex).not.toContain('__Y__');
  });

  test('replaces __S__ with literal scale', () => {
    const exprs = buildDraggableExpressions('O', 2, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[0].latex).toContain('2');
    expect(exprs[0].latex).not.toContain('__S__');
  });

  test('first char uses bare xVar (no offset)', () => {
    const exprs = buildDraggableExpressions('O', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    // No offset added for first char
    expect(exprs[0].latex).toContain('x_{dt} +');
    expect(exprs[0].latex).not.toContain('x_{dt}+');
  });

  test('second char appends cursor offset to xVar', () => {
    const exprs = buildDraggableExpressions('OO', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[1].latex).toContain('x_{dt}+' + CHAR_WIDTH);
  });

  test('second line uses negative yVar offset', () => {
    const exprs = buildDraggableExpressions('O\nO', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[1].latex).toContain('y_{dt}-' + LINE_HEIGHT);
  });

  test('expression IDs match buildExpressions format', () => {
    const exprs = buildDraggableExpressions('OA', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    expect(exprs[0].id).toBe('txt-0-s0');
    expect(exprs[1].id).toBe('txt-1-s0');
  });

  test('produces no literal x/y numbers, only variable references', () => {
    const exprs = buildDraggableExpressions('O', 1, SAMPLE_GLYPHS, 'x_{dt}', 'y_{dt}');
    // The literal x=0, y=0 should NOT appear; only the variable names
    expect(exprs[0].latex).not.toMatch(/\(0 \+/);
  });
});

describe('clearExpressionIds', () => {
  test('returns ids for all expressions of a rendered string', () => {
    const exprs = buildExpressions('AO', 0, 0, 1, SAMPLE_GLYPHS);
    const ids = clearExpressionIds(exprs);
    expect(ids).toEqual(exprs.map(e => ({ id: e.id })));
  });

  test('returns empty array for empty expression list', () => {
    expect(clearExpressionIds([])).toEqual([]);
  });
});
