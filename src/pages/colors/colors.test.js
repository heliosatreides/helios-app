import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, generatePalette } from './colorUtils';

describe('hexToRgb', () => {
  test('parses basic hex color', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  test('handles hex without hash', () => {
    expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
  });

  test('parses mixed color', () => {
    const [r, g, b] = hexToRgb('#3b82f6');
    expect(r).toBe(59);
    expect(g).toBe(130);
    expect(b).toBe(246);
  });

  test('returns null for invalid hex', () => {
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });

  test('handles black and white', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });
});

describe('rgbToHex', () => {
  test('converts rgb to hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });
});

describe('rgbToHsl', () => {
  test('pure red = hue 0', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  test('pure green = hue 120', () => {
    const [h] = rgbToHsl(0, 255, 0);
    expect(h).toBe(120);
  });

  test('pure blue = hue 240', () => {
    const [h] = rgbToHsl(0, 0, 255);
    expect(h).toBe(240);
  });

  test('white = lightness 100', () => {
    const [, , l] = rgbToHsl(255, 255, 255);
    expect(l).toBe(100);
  });

  test('black = lightness 0', () => {
    const [, , l] = rgbToHsl(0, 0, 0);
    expect(l).toBe(0);
  });
});

describe('generatePalette complementary', () => {
  test('complementary color is opposite on the color wheel', () => {
    // Red (#ff0000) -> complementary should be cyan-ish
    const palette = generatePalette('#ff0000');
    expect(palette).not.toBeNull();
    const comp = palette.complementary[0];
    const [h] = comp.hsl;
    // Complementary of hue 0 (red) is hue 180 (cyan)
    expect(h).toBeCloseTo(180, -1);
  });

  test('generates base color correctly', () => {
    const palette = generatePalette('#3b82f6');
    expect(palette.base.hex).toBe('#3b82f6');
  });

  test('generates analogous colors (±30°)', () => {
    const palette = generatePalette('#ff0000');
    expect(palette.analogous).toHaveLength(2);
  });

  test('generates triadic colors (120° apart)', () => {
    const palette = generatePalette('#ff0000');
    expect(palette.triadic).toHaveLength(2);
  });

  test('returns null for invalid hex', () => {
    expect(generatePalette('#zzz')).toBeNull();
  });
});
