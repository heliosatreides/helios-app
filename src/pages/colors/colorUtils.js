// Color palette generation utilities

/** Parse hex to [r, g, b] (0-255) */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/** [r,g,b] to hex */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

/** [r,g,b] to [h(0-360), s(0-100), l(0-100)] */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** [h(0-360), s(0-100), l(0-100)] to [r,g,b] */
export function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Rotate hue by degrees */
function rotateHue(h, s, l, deg) {
  return hslToRgb((h + deg + 360) % 360, s, l);
}

/**
 * Generate a full palette from a hex color.
 * Returns { base, complementary, analogous, triadic, splitComplementary }
 */
export function generatePalette(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);

  const makeColor = (rgb) => {
    const [r, g, b] = rgb;
    const [hr, sr, lr] = rgbToHsl(r, g, b);
    return { hex: rgbToHex(r, g, b), rgb: [r, g, b], hsl: [hr, sr, lr] };
  };

  return {
    base: makeColor([r, g, b]),
    complementary: [makeColor(rotateHue(h, s, l, 180))],
    analogous: [makeColor(rotateHue(h, s, l, -30)), makeColor(rotateHue(h, s, l, 30))],
    triadic: [makeColor(rotateHue(h, s, l, 120)), makeColor(rotateHue(h, s, l, 240))],
    splitComplementary: [makeColor(rotateHue(h, s, l, 150)), makeColor(rotateHue(h, s, l, 210))],
  };
}

/** Generate Tailwind CSS custom properties from a palette */
export function generateCssVars(palette) {
  if (!palette) return '';
  const lines = [
    `:root {`,
    `  --color-base: ${palette.base.hex};`,
    ...palette.complementary.map((c, i) => `  --color-complementary-${i + 1}: ${c.hex};`),
    ...palette.analogous.map((c, i) => `  --color-analogous-${i + 1}: ${c.hex};`),
    ...palette.triadic.map((c, i) => `  --color-triadic-${i + 1}: ${c.hex};`),
    ...palette.splitComplementary.map((c, i) => `  --color-split-${i + 1}: ${c.hex};`),
    `}`,
  ];
  return lines.join('\n');
}
