// Convert the site's oklch() and rgb() token values to 8-bit sRGB.
// The CSS text stays the source. These channels are only the export.

export function channelsFor(value) {
  const oklch = parseOklch(value);
  if (oklch) return oklchToChannels(oklch);
  const rgb = parseRgb(value);
  if (rgb) return rgb;
  throw new Error(`No color conversion for ${value}`);
}

export function hex(channels) {
  const part = (n) => n.toString(16).padStart(2, "0");
  return `#${part(channels.r)}${part(channels.g)}${part(channels.b)}`;
}

function parseOklch(value) {
  const match = value
    .trim()
    .match(/^oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)(?:deg)?\s*\)$/);
  if (!match) return null;
  return {
    l: Number(match[1]) / 100,
    c: Number(match[2]),
    h: Number(match[3]),
  };
}

function parseRgb(value) {
  const match = value
    .trim()
    .match(/^rgb\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\/\s*([0-9.]+)\s*\)$/);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: Number(match[4]),
  };
}

function oklchToChannels({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const ll = l_ ** 3;
  const mm = m_ ** 3;
  const ss = s_ ** 3;
  const r = 4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss;
  const g = -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss;
  const bl = -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss;
  return {
    r: byte(r),
    g: byte(g),
    b: byte(bl),
    a: 1,
  };
}

function byte(linear) {
  const clamped = Math.min(Math.max(linear, 0), 1);
  const encoded =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(encoded, 0), 1) * 255);
}
