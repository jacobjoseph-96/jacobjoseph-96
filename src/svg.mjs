/** Tiny SVG string helpers. No dependencies, no DOM, no template engine. */

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Round to `d` decimals and normalise -0, so output diffs stay stable. */
export const n = (v, d = 2) => {
  const r = Number(Number(v).toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};

/** Build an element from an attribute bag; null/undefined attrs are dropped. */
export function el(tag, attrs = {}, children = '') {
  const a = Object.entries(attrs)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? n(v) : esc(v)}"`)
    .join('');
  return children === null || children === ''
    ? `<${tag}${a}/>`
    : `<${tag}${a}>${children}</${tag}>`;
}

export const g = (attrs, children) => el('g', attrs, children);
export const text = (s, attrs) => el('text', attrs, esc(s));

/** Regular polygon points, first vertex pointing up. */
export function polygon(r, sides, rotate = -90) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rotate + (360 / sides) * i) * Math.PI) / 180;
    pts.push(`${n(Math.cos(a) * r)},${n(Math.sin(a) * r)}`);
  }
  return pts.join(' ');
}

/** Jagged polyline radiating from the origin — cracks, Haki bolts, speed lines. */
export function bolt(angleDeg, from, to, segments, spread, rnd) {
  const a = (angleDeg * Math.PI) / 180;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = from + (to - from) * t;
    const off = i === 0 || i === segments ? 0 : (rnd() - 0.5) * spread;
    const pa = a + off / Math.max(r, 1);
    pts.push(`${n(Math.cos(pa) * r)},${n(Math.sin(pa) * r)}`);
  }
  return pts.join(' ');
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
