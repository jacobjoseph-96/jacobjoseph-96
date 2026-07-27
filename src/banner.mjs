/**
 * The contribution banner.
 *
 * One renderer, two skins:
 *   solo     — an empty battlefield, the word ARISE, and every day you committed
 *              rising out of the void as a shadow soldier.
 *   onepiece — an uncharted sea, コード王におれはなる！！！, and every day you
 *              committed surfacing as an island you claimed.
 *
 * Pure SVG + CSS keyframes. No JS, no SMIL, no external requests — this has to
 * survive being served through GitHub's camo image proxy as an inert image.
 *
 * Robustness property (verify this first if you change anything): with CSS
 * stripped, the base attributes must render the FINISHED army. Animations only
 * ever take things away and put them back. Nothing is missing in the fallback;
 * you just don't get the show.
 */

import { el, g, text, esc, n, polygon, bolt } from './svg.mjs';
import { mulberry32, COLS, ROWS } from './derive.mjs';
import JA from './glyphs-ja.json' with { type: 'json' };

/* ── geometry ─────────────────────────────────────────────────────────── */
const P = 20, CELL = 15, RAD = 3.5;
const OX = 48, OY = 100;
const W = 1160, H = 300;
const BW = (COLS - 1) * P + CELL;   // 1055
const BH = (ROWS - 1) * P + CELL;   // 135
const CX = OX + BW / 2;             // 575.5
const CY = OY + BH / 2;             // 167.5

const cellX = (x) => OX + x * P;
const cellY = (y) => OY + y * P;
const midX  = (x) => cellX(x) + CELL / 2;
const botY  = (y) => cellY(y) + CELL;

/* ── timing (seconds) ─────────────────────────────────────────────────── */
const T = {
  ring: 0.90, ringDur: 0.60,
  inhale: 2.30, inhaleDur: 0.85,
  impact: 3.15,
  wave: 0.055,          // per cell of distance
  cellDur: 0.62,
  textFade: 4.60, textFadeDur: 0.60,
  eliteStart: 5.40, eliteStep: 0.26, eliteDur: 0.90,
  oath: 7.00,
  ambient: 8.20,
};

/**
 * A pure Euclidean radius would be wrong here: the grid is 53 wide and 7 tall,
 * so a circular front leaves the top and bottom edges almost immediately and
 * spends the rest of its life as two vertical lines. Weighting the vertical
 * term to 0.28 gives a gently convex front sweeping both ways — which is what
 * actually reads as a shockwave in a 53:7 frame.
 *
 * The jitter matters more than it sounds. Without it the wave looks like a
 * progress bar; with it, the ground is breaking.
 */
const cellDelay = (x, y, rnd) =>
  T.impact + (Math.abs(x - 26) + 0.28 * Math.abs(y - 3)) * T.wave + (rnd() - 0.5) * 0.12;

/* ── stylesheet ───────────────────────────────────────────────────────── */
function css(t) {
  const solo = t.skin === 'solo';
  return `
*{transform-box:fill-box}
text{font-family:${t.font};white-space:pre}

/* cells ------------------------------------------------------------- */
.c{transform-origin:50% 100%;animation:rise ${T.cellDur}s cubic-bezier(.2,1.55,.35,1) both}
.z{transform-origin:50% 100%;animation:chop .5s ease-out both}
.fl{transform-origin:50% 100%;animation:flash .25s ease-out both}
@keyframes rise{0%{opacity:0;transform:scale(.001)}40%{opacity:1;transform:scale(.86,1.22)}70%{transform:scale(1.08,.94)}100%{opacity:1;transform:scale(1,1)}}
@keyframes chop{0%,40%{transform:scale(1)}58%{transform:scale(.78)}100%{transform:scale(1)}}
@keyframes flash{0%{opacity:0}4%{opacity:.95}100%{opacity:0}}

/* ${solo ? 'wisps' : 'water ripples'} ------------------------------------ */
.w{transform-origin:${solo ? '50% 100%' : '50% 50%'};animation:${solo ? 'wisp .9s' : 'ripple 1s'} ease-out both}
${solo
  ? `@keyframes wisp{0%{opacity:0;transform:scale(1,.2)}25%{opacity:.5}100%{opacity:0;transform:translateY(-26px) scale(.5,1.6)}}`
  : `@keyframes ripple{0%{opacity:0;transform:scale(.1)}20%{opacity:.55}100%{opacity:0;transform:scale(2.4)}}`}

/* the board shudders while the ${solo ? 'summon' : 'declaration'} charges - */
.q{animation:quake ${T.inhaleDur}s ease-in-out ${T.inhale}s both}
@keyframes quake{0%,100%{transform:translate(0,0)}15%{transform:translate(.7px,-.4px)}35%{transform:translate(-.6px,.5px)}55%{transform:translate(.5px,.6px)}75%{transform:translate(-.4px,-.5px)}}

/* elites -------------------------------------------------------------- */
.pl{transform-origin:50% 100%;animation:pillar ${T.eliteDur}s ease-out both}
.er{transform-origin:50% 50%;animation:eliteRing ${T.eliteDur}s ease-out both}
@keyframes pillar{0%{opacity:0;transform:scaleY(0)}20%{opacity:.8}100%{opacity:0;transform:scaleY(1)}}
@keyframes eliteRing{0%{opacity:0;transform:scale(.1)}25%{opacity:.7}100%{opacity:0;transform:scale(2.6)}}

/* one-shot reveals ---------------------------------------------------- */
.io{animation-fill-mode:both;animation-timing-function:ease-out}
@keyframes inout{0%{opacity:0}14%{opacity:1}78%{opacity:1}100%{opacity:0}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}

/* the ${solo ? 'rune ring' : 'log pose'} -------------------------------- */
.r1{transform-origin:50% 50%;animation:spin 24s linear infinite}
.r2{transform-origin:50% 50%;animation:spinR 18s linear infinite}
.r3{transform-origin:50% 50%;animation:spin 31s linear infinite}
.dr{animation:draw ${T.ringDur}s ease-out ${T.ring}s both}
.core{transform-origin:50% 50%;animation:core 3s ease-in-out ${T.ring}s infinite,inout ${T.impact - T.ring + .5}s ${T.ring}s both}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinR{to{transform:rotate(-360deg)}}
@keyframes draw{from{stroke-dashoffset:var(--len,700)}to{stroke-dashoffset:0}}
@keyframes core{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
${solo ? '' : `.nd{transform-origin:50% 100%;animation:needle ${T.impact - T.ring}s cubic-bezier(.3,0,.1,1) ${T.ring}s both}
@keyframes needle{0%{transform:rotate(0)}10%{transform:rotate(680deg)}25%{transform:rotate(1180deg)}45%{transform:rotate(1490deg)}70%{transform:rotate(1655deg)}100%{transform:rotate(1710deg)}}`}

/* the burst ------------------------------------------------------------ */
.sw{transform-origin:50% 50%;animation:shock 1.5s cubic-bezier(.15,.7,.3,1) ${T.impact}s both}
@keyframes shock{0%{opacity:0;transform:scale(.02,.02)}8%{opacity:.85}100%{opacity:0;transform:scale(9.5,2.6)}}
.ck{animation:crack 1.4s ease-out ${T.impact}s both}
@keyframes crack{0%{opacity:0}10%{opacity:.6}100%{opacity:0}}

/* the word ------------------------------------------------------------- */
.scrim{animation:scrim ${n(T.textFade + T.textFadeDur - T.impact, 2)}s ease-out ${T.impact}s both}
@keyframes scrim{0%{opacity:0}9%{opacity:${solo ? '.42' : '.6'}}80%{opacity:${solo ? '.42' : '.6'}}100%{opacity:0}}
${solo
  ? `.big{transform-origin:50% 50%;animation:ariseIn ${T.textFade + T.textFadeDur - T.impact}s cubic-bezier(.16,1.5,.3,1) ${T.impact}s both}
@keyframes ariseIn{0%{opacity:0;letter-spacing:46px;transform:scale(1.22)}14%{opacity:1;letter-spacing:18px;transform:scale(1)}75%{opacity:1;transform:scale(1.015)}88%{opacity:1;transform:scale(1.02)}100%{opacity:0;transform:scale(1.09)}}`
  : `.big{transform-origin:50% 50%;animation:jaSlam ${T.textFade + T.textFadeDur - T.impact}s cubic-bezier(.16,1.6,.3,1) ${T.impact}s both}
@keyframes jaSlam{0%{opacity:0;transform:scale(1.35) rotate(-4deg)}9%{opacity:1;transform:scale(.96) rotate(-4deg)}16%{transform:scale(1) rotate(-2.5deg)}80%{opacity:1;transform:scale(1) rotate(-2.5deg)}100%{opacity:0;transform:scale(1.07) rotate(0deg)}}
.sl{animation:speed .42s ease-out ${T.impact}s both}
@keyframes speed{0%{opacity:0;transform:scale(.4)}12%{opacity:.75}100%{opacity:0;transform:scale(1.35)}}
.ht{transform-origin:50% 50%;animation:halftone .55s ease-out ${T.impact}s both}
@keyframes halftone{0%{opacity:0;transform:scale(0)}22%{opacity:.32;transform:scale(1)}100%{opacity:0;transform:scale(1.15)}}`}

/* status lines ---------------------------------------------------------- */
.cy{animation:cyc 15s linear infinite backwards}
@keyframes cyc{0%{opacity:0}3%{opacity:1}27%{opacity:1}31%{opacity:0}100%{opacity:0}}

/* ambient --------------------------------------------------------------- */
.em{animation:${solo ? 'ember' : 'foam'} linear infinite backwards}
${solo
  ? `@keyframes ember{0%{opacity:0;transform:translate(0,0)}15%{opacity:.65}100%{opacity:0;transform:translate(7px,-72px)}}`
  : `@keyframes foam{0%{opacity:0;transform:translate(0,0)}18%{opacity:.55}100%{opacity:0;transform:translate(86px,-9px)}}`}
.sh{animation:${solo ? 'shimmer 7s' : 'swell 17s'} linear ${T.ambient}s infinite backwards}
${solo
  ? `@keyframes shimmer{0%{opacity:0;transform:translateX(-380px)}12%{opacity:.34}88%{opacity:.34}100%{opacity:0;transform:translateX(1200px)}}`
  : `@keyframes swell{0%{opacity:0;transform:translateX(-140px)}12%{opacity:.1}88%{opacity:.1}100%{opacity:0;transform:translateX(140px)}}`}
.ey{animation:eye 5s ease-in-out infinite backwards}
@keyframes eye{0%{opacity:0}6%{opacity:.8}12%{opacity:.14}54%{opacity:.14}59%{opacity:.85}65%{opacity:.14}100%{opacity:0}}
${solo ? '' : `.fg{animation:fadeIn .3s ease-out both,flagwave 2.4s ease-in-out ${T.ambient}s infinite backwards}
.fg{transform-origin:0% 50%}
@keyframes flagwave{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.5)}}`}
.sig{transform-origin:50% 50%;animation:spin 40s linear infinite}
`.replace(/\n{2,}/g, '\n').trim();
}

/* ── defs ─────────────────────────────────────────────────────────────── */
function defs(t) {
  const solo = t.skin === 'solo';
  return el('defs', {}, [
    // vignette
    el('radialGradient', { id: 'vig', cx: '50%', cy: '50%', r: '72%' },
      el('stop', { offset: '55%', 'stop-color': t.voidDeep, 'stop-opacity': 0 }) +
      el('stop', { offset: '100%', 'stop-color': t.voidDeep, 'stop-opacity': solo ? 0.95 : 0.8 })),
    // the plume / bloom blob
    el('radialGradient', { id: 'plume' },
      el('stop', { offset: '0%', 'stop-color': t.monarch, 'stop-opacity': 0.85 }) +
      el('stop', { offset: '100%', 'stop-color': t.monarch, 'stop-opacity': 0 })),
    // elite-cell bloom
    el('radialGradient', { id: 'bloom' },
      el('stop', { offset: '0%', 'stop-color': t.ramp[4], 'stop-opacity': 0.5 }) +
      el('stop', { offset: '45%', 'stop-color': t.ramp[4], 'stop-opacity': 0.2 }) +
      el('stop', { offset: '100%', 'stop-color': t.ramp[4], 'stop-opacity': 0 })),
    // magic-circle core
    el('radialGradient', { id: 'core' },
      el('stop', { offset: '0%', 'stop-color': t.monarch, 'stop-opacity': 0.7 }) +
      el('stop', { offset: '60%', 'stop-color': t.monarchDim, 'stop-opacity': 0.22 }) +
      el('stop', { offset: '100%', 'stop-color': t.monarchDim, 'stop-opacity': 0 })),
    // elite pillar
    el('linearGradient', { id: 'pil', x1: '0', y1: '1', x2: '0', y2: '0' },
      el('stop', { offset: '0%', 'stop-color': t.gold, 'stop-opacity': 0.9 }) +
      el('stop', { offset: '100%', 'stop-color': t.gold, 'stop-opacity': 0 })),
    el('linearGradient', { id: 'pil2', x1: '0', y1: '1', x2: '0', y2: '0' },
      el('stop', { offset: '0%', 'stop-color': t.arcane, 'stop-opacity': 0.85 }) +
      el('stop', { offset: '100%', 'stop-color': t.arcane, 'stop-opacity': 0 })),
    // shimmer band / swell
    el('linearGradient', { id: 'shim' },
      el('stop', { offset: '0%', 'stop-color': t.monarch, 'stop-opacity': 0 }) +
      el('stop', { offset: '50%', 'stop-color': solo ? t.arcane : t.flash, 'stop-opacity': 0.55 }) +
      el('stop', { offset: '100%', 'stop-color': t.monarch, 'stop-opacity': 0 })),
    // scanlines / halftone
    el('pattern', { id: 'scan', width: 3, height: 3, patternUnits: 'userSpaceOnUse' },
      el('rect', { width: 3, height: 1, fill: t.text, opacity: 0.05 })),
    el('pattern', { id: 'dots', width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
      el('circle', { cx: 3, cy: 3, r: 1.3, fill: t.text })),
    t.paper
      ? el('filter', { id: 'grain' },
          el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 3, result: 'nz' }) +
          el('feColorMatrix', { in: 'nz', type: 'saturate', values: '0' }) +
          el('feComponentTransfer', {}, el('feFuncA', { type: 'linear', slope: '0.06' })))
      : '',
    el('filter', { id: 'glow', x: '-40%', y: '-60%', width: '180%', height: '260%' },
      el('feGaussianBlur', { stdDeviation: 5, result: 'b' }) +
      el('feMerge', {}, el('feMergeNode', { in: 'b' }) + el('feMergeNode', { in: 'b' }) + el('feMergeNode', { in: 'SourceGraphic' }))),
  ].join(''));
}

/* ── set-pieces ───────────────────────────────────────────────────────── */

/** Solo Leveling: the rune ring. Three coprime rotation periods so it never repeats. */
function runeRing(t) {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    return el('line', {
      x1: n(Math.cos(a) * 100), y1: n(Math.sin(a) * 100),
      x2: n(Math.cos(a) * (i % 3 === 0 ? 110 : 105)), y2: n(Math.sin(a) * (i % 3 === 0 ? 110 : 105)),
      stroke: t.monarch, 'stroke-width': i % 3 === 0 ? 1.6 : 0.8, opacity: 0.75,
    });
  }).join('');

  // Abstract geometric marks, deliberately not a real script.
  const glyphs = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180, r = 64;
    const x = n(Math.cos(a) * r), y = n(Math.sin(a) * r);
    const forms = [
      `M${x - 4} ${y - 4}L${x + 4} ${y + 4}M${x + 4} ${y - 4}L${x - 4} ${y + 4}`,
      `M${x} ${y - 5}L${x + 4} ${y + 3}L${x - 4} ${y + 3}Z`,
      `M${x - 4} ${y}h8M${x} ${y - 4}v8`,
      `M${x - 4} ${y - 3}h8v6h-8Z`,
    ];
    return el('path', { d: forms[i % 4], stroke: t.arcane, 'stroke-width': 1.3, fill: 'none', opacity: 0.8 });
  }).join('');

  return g({ class: 'io', style: `animation-name:inout;animation-duration:${T.impact - T.ring + 0.55}s;animation-delay:${T.ring}s`, opacity: 0 },
    g({ transform: `translate(${CX} ${CY})` },
      el('circle', { class: 'core', r: 40, fill: 'url(#core)' }) +
      g({ class: 'r1' },
        el('circle', { class: 'dr', r: 110, fill: 'none', stroke: t.monarch, 'stroke-width': 1.5,
          'stroke-dasharray': 692, style: '--len:692', opacity: 0.9 }) + ticks) +
      g({ class: 'r2' },
        el('circle', { class: 'dr', r: 78, fill: 'none', stroke: t.arcane, 'stroke-width': 1.1,
          'stroke-dasharray': '12 6 4 6', style: '--len:490', opacity: 0.7 }) + glyphs) +
      g({ class: 'r3' },
        el('polygon', { points: polygon(92, 6), fill: 'none', stroke: t.monarchDim, 'stroke-width': 1.2, opacity: 0.45 })))
  );
}

/** One Piece: the Log Pose. Grand Line log poses do not behave — the needle knows it. */
function logPose(t) {
  const rhumb = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 * Math.PI) / 180;
    return el('line', { x1: 0, y1: 0, x2: n(Math.cos(a) * 118), y2: n(Math.sin(a) * 118),
      stroke: t.primary, 'stroke-width': 0.5, opacity: 0.28 });
  }).join('');
  const rose = [0, 90, 180, 270].map((d) => {
    const a = (d * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return el('polygon', { points: `${n(c * 62)},${n(s * 62)} ${n(-s * 9)},${n(c * 9)} ${n(-c * 12)},${n(-s * 12)} ${n(s * 9)},${n(-c * 9)}`,
      fill: d % 180 === 0 ? t.primary : t.textMuted, opacity: 0.55 });
  }).join('');

  return g({ class: 'io', style: `animation-name:inout;animation-duration:${T.impact - T.ring + 0.55}s;animation-delay:${T.ring}s`, opacity: 0 },
    g({ transform: `translate(${CX} ${CY})` },
      el('circle', { class: 'core', r: 40, fill: 'url(#core)' }) + rhumb + rose +
      g({ class: 'r1' },
        el('circle', { class: 'dr', r: 110, fill: 'none', stroke: t.primary, 'stroke-width': 1.5,
          'stroke-dasharray': 692, style: '--len:692', opacity: 0.85 })) +
      g({ class: 'r2' },
        el('circle', { class: 'dr', r: 82, fill: 'none', stroke: t.gold, 'stroke-width': 1,
          'stroke-dasharray': '10 5', style: '--len:515', opacity: 0.6 })) +
      el('polygon', { class: 'nd', points: '0,6 -5,6 0,-74 5,6', fill: t.monarch, opacity: 0.95 }) +
      el('circle', { r: 4.5, fill: t.gold }))
  );
}

/** The word — the beat everything else exists to set up. */
function theWord(t, rnd) {
  // The ranks dim behind the word so the type never fights the cells, then come
  // back up as it fades. Without this the board wins and the beat reads as noise.
  const scrim = el('rect', { class: 'scrim', x: OX - 12, y: OY - 12, width: BW + 24, height: BH + 24,
    fill: t.void, opacity: 0 });

  if (t.skin === 'solo') {
    // text-anchor:middle counts the trailing letter-space, so nudge back by half.
    const common = { x: CX + 9, y: CY + 26, 'text-anchor': 'middle', 'font-size': 72, 'font-weight': 700, 'letter-spacing': 18 };
    return scrim + g({ class: 'big', opacity: 0 },
      text('ARISE', { ...common, fill: t.monarch, opacity: t.mode === 'dark' ? 0.55 : 0.32, filter: 'url(#glow)' }) +
      // Knockout stroke, same trick the manga panel uses. It lets the scrim stay
      // light enough that the ranks are still readable behind the word.
      text('ARISE', { ...common, fill: 'none', stroke: t.inkEdge, 'stroke-width': 9, 'stroke-linejoin': 'round' }) +
      text('ARISE', { ...common, fill: t.ink })
    );
  }

  // Manga panel: triple-stacked outline, speed lines, halftone burst, tilt.
  const s = 48 / JA.size;
  const wJa = JA.advance * s;
  const jaAt = (dx, dy) => `translate(${n(CX - wJa / 2 + dx)} ${n(164 + dy)}) scale(${n(s, 4)})`;
  const speed = Array.from({ length: 18 }, (_, i) => {
    const a = (i * 20 + rnd() * 5) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    const r0 = 118 + rnd() * 26, r1 = r0 + 62 + rnd() * 90, w = 3.5 + rnd() * 4;
    return el('polygon', { points: `${n(c * r0 - sn * w)},${n(sn * r0 + c * w)} ${n(c * r1)},${n(sn * r1)} ${n(c * r0 + sn * w)},${n(sn * r0 - c * w)}`,
      fill: t.ink });
  }).join('');

  return [
    scrim,
    el('circle', { class: 'ht', cx: CX, cy: CY, r: 168, fill: 'url(#dots)', opacity: 0 }),
    g({ class: 'sl', opacity: 0, transform: `translate(${CX} ${CY})` }, speed),
    g({ class: 'big', opacity: 0 }, [
      el('path', { d: JA.d, transform: jaAt(5, 5), fill: t.monarch }),
      el('path', { d: JA.d, transform: jaAt(0, 0), fill: 'none', stroke: t.inkEdge, 'stroke-width': 9 / s, 'stroke-linejoin': 'round' }),
      el('path', { d: JA.d, transform: jaAt(0, 0), fill: t.ink }),
      text(t.copy.romaji, { x: CX + 1.7, y: 188, 'text-anchor': 'middle', 'font-size': 13, 'letter-spacing': 3.4,
        fill: 'none', stroke: t.inkEdge, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }),
      text(t.copy.romaji, { x: CX + 1.7, y: 188, 'text-anchor': 'middle', 'font-size': 13, 'letter-spacing': 3.4, fill: t.primary }),
      text(t.copy.en, { x: CX + 0.8, y: 212, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, 'letter-spacing': 1.6,
        fill: 'none', stroke: t.inkEdge, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }),
      text(t.copy.en, { x: CX + 0.8, y: 212, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, 'letter-spacing': 1.6, fill: t.gold }),
    ].join('')),
  ].join('');
}

/* ── the banner ───────────────────────────────────────────────────────── */
/**
 * @param {ReturnType<import('./derive.mjs').derive>} d
 * @param {import('./theme.mjs').Theme} t
 * @param {{animate?:boolean}} [opts]
 */
export function renderBanner(d, t, opts = {}) {
  const animate = opts.animate !== false;
  const solo = t.skin === 'solo';
  const rnd = mulberry32(0xa715e);
  const A = (cls, style, extra = {}) => (animate ? { class: cls, style, ...extra } : extra);

  /* labels ------------------------------------------------------------ */
  const labels =
    d.months.map((m) => text(m.label, { x: cellX(m.x), y: OY - 8, 'font-size': 9.5, 'letter-spacing': 1.2, fill: t.textMuted })).join('') +
    ['MON', 'WED', 'FRI'].map((lab, i) => text(lab, { x: OX - 8, y: cellY(1 + i * 2) + 11.5, 'text-anchor': 'end', 'font-size': 8.5, fill: t.textMuted })).join('');

  /* cells -------------------------------------------------------------- */
  const delays = new Map();
  for (const c of d.cells) delays.set(c.d, cellDelay(c.x, c.y, rnd));
  const eliteByDate = new Map(d.elites.map((e) => [e.d, e]));
  for (const e of d.elites) delays.set(e.d, T.eliteStart + e.rank * T.eliteStep);

  const empties = [], soldiers = [], flashes = [], plumes = [], eyes = [], flags = [];
  for (const c of d.cells) {
    const base = { x: cellX(c.x), y: cellY(c.y), width: CELL, height: CELL, rx: RAD };
    const del = delays.get(c.d);

    if (c.l === 0) {
      empties.push(el('rect', { ...base, fill: t.grave, stroke: t.graveEdge, 'stroke-width': 0.6,
        ...A('z', `animation-delay:${n(del, 3)}s`) }));
      continue;
    }

    // A soft bloom behind the brightest cells. A radial gradient, not a filter —
    // 371 filtered elements would wreck rendering performance.
    if (c.l === 4) {
      soldiers.push(el('circle', { cx: midX(c.x), cy: cellY(c.y) + CELL / 2, r: 15,
        fill: 'url(#bloom)', ...A('c', `animation-delay:${n(del, 3)}s`) }));
    }
    soldiers.push(el('rect', { ...base, fill: t.ramp[c.l], ...A('c', `animation-delay:${n(del, 3)}s`) }));

    if (animate) {
      flashes.push(el('rect', { ...base, fill: t.flash, opacity: 0, class: 'fl', style: `animation-delay:${n(del + 0.18, 3)}s` }));
      if (c.l >= 2) {
        plumes.push(solo
          ? el('ellipse', { cx: midX(c.x), cy: botY(c.y) - 12, rx: 4.5, ry: 12, fill: 'url(#plume)', opacity: 0,
              class: 'w', style: `animation-delay:${n(del + 0.05, 3)}s` })
          : el('ellipse', { cx: midX(c.x), cy: botY(c.y) - 2, rx: 11, ry: 4, fill: 'none', stroke: t.primary,
              'stroke-width': 1.2, opacity: 0, class: 'w', style: `animation-delay:${n(del + 0.05, 3)}s` }));
      }
      if (c.l === 4) {
        eyes.push(g({ class: 'ey', opacity: 0, style: `animation-delay:${n(T.ambient + rnd() * 4, 2)}s;animation-duration:${n(4 + rnd() * 2, 1)}s` },
          el('circle', { cx: midX(c.x) - 2.6, cy: cellY(c.y) + 6.5, r: 0.9, fill: t.flash }) +
          el('circle', { cx: midX(c.x) + 2.6, cy: cellY(c.y) + 6.5, r: 0.9, fill: t.flash })));
      }
    }
    if (!solo && c.l >= 3) {
      // Raised flags. ~90 of them rippling out of phase is the best ambient
      // detail in either skin.
      const fx = cellX(c.x) + CELL - 1, fy = cellY(c.y) - 1;
      flags.push(g({ opacity: animate ? 0 : 1, ...A('fg', `animation-delay:${n(delays.get(c.d) + 0.45, 3)}s,${n(T.ambient + rnd() * 2.4, 2)}s`) },
        el('line', { x1: fx, y1: fy, x2: fx, y2: fy - 9, stroke: t.text, 'stroke-width': 0.9, opacity: 0.7 }) +
        el('polygon', { points: `${fx},${fy - 9} ${fx + 7},${fy - 7} ${fx},${fy - 5}`, fill: c.l === 4 ? t.gold : t.monarch })));
    }
  }

  /* elites -------------------------------------------------------------- */
  const eliteArt = [], eliteLabels = [];
  d.elites.forEach((e) => {
    const del = T.eliteStart + e.rank * T.eliteStep;
    const x = midX(e.x), y = botY(e.y);
    const isTop = e.rank === 0;
    if (animate) {
      eliteArt.push(el('rect', { x: x - 2.5, y: y - 104, width: 5, height: 104, rx: 2.5,
        fill: isTop ? 'url(#pil)' : 'url(#pil2)', opacity: 0, class: 'pl', style: `animation-delay:${n(del + 0.1, 3)}s` }));
      eliteArt.push(el('circle', { cx: x, cy: y - 2, r: 16, fill: 'none', stroke: isTop ? t.gold : t.arcane,
        'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke', opacity: 0, class: 'er', style: `animation-delay:${n(del + 0.12, 3)}s` }));
    }
    const name = t.copy.elites[e.rank] ?? `#${e.rank + 1}`;
    eliteLabels.push(g({ opacity: 0, ...A('io', `animation-name:inout;animation-duration:${n(T.ambient - del + 0.6, 2)}s;animation-delay:${n(del + 0.25, 3)}s`) },
      el('line', { x1: x, y1: y + 3, x2: x, y2: 246, stroke: isTop ? t.gold : t.arcane, 'stroke-width': 0.7, opacity: 0.5 }) +
      text(name, { x, y: 256, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, 'letter-spacing': 1.4, fill: isTop ? t.gold : t.arcane }) +
      text(`${e.c}`, { x, y: 267, 'text-anchor': 'middle', 'font-size': 7.5, fill: t.textMuted })));
  });

  /* the burst ----------------------------------------------------------- */
  const cracks = Array.from({ length: 14 }, (_, i) =>
    el('polyline', { points: bolt(i * 25.7 + rnd() * 12, 24, 120 + rnd() * 190, 5, 26, rnd),
      fill: 'none', stroke: solo ? t.arcane : t.monarch, 'stroke-width': 1.1, 'stroke-linecap': 'round' })).join('');
  const haki = solo ? '' : Array.from({ length: 12 }, (_, i) =>
    el('polyline', { points: bolt(i * 30 + rnd() * 14, 30, 200 + rnd() * 240, 7, 60, rnd),
      fill: 'none', stroke: t.arcane, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.85 })).join('');

  const burst = animate ? [
    g({ class: 'ck', opacity: 0, transform: `translate(${CX} ${CY})` }, cracks + haki),
    // non-scaling-stroke keeps the wave a thin ring instead of a fattening ellipse
    // as it scales 9x horizontally.
    // Started flat (100×26) so the wave sweeps *along* the ranks and stays inside
    // the 53:7 band instead of drawing a giant oval across the whole frame.
    el('ellipse', { class: 'sw', cx: CX, cy: CY, rx: 100, ry: 26, fill: 'none',
      stroke: solo ? t.monarch : t.monarchDim, 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke', opacity: 0 }),
  ].join('') : '';

  /* ambient ------------------------------------------------------------- */
  const motes = animate ? Array.from({ length: 24 }, () => {
    const x = OX + rnd() * BW, y = OY + rnd() * BH;
    return el('circle', { cx: n(x), cy: n(y), r: n(0.8 + rnd() * 1.3, 2), fill: solo ? t.arcane : t.flash, opacity: 0,
      class: 'em', style: `animation-duration:${n((solo ? 6 : 7) + rnd() * (solo ? 5 : 6), 1)}s;animation-delay:${n(T.ambient + rnd() * 9, 2)}s` });
  }).join('') : '';

  const sweep = animate
    ? (solo
        ? el('rect', { class: 'sh', x: OX - 380, y: OY - 4, width: 300, height: BH + 8, fill: 'url(#shim)', opacity: 0 })
        : Array.from({ length: 3 }, (_, i) => {
            const yy = OY + 24 + i * 44;
            const pts = Array.from({ length: 28 }, (_, k) => `${n(OX - 140 + k * 50)},${n(yy + Math.sin(k * 0.8 + i) * 5)}`).join(' ');
            return el('polyline', { class: 'sh', points: pts, fill: 'none', stroke: t.primary, 'stroke-width': 1.4, opacity: 0,
              style: `animation-duration:${[11, 17, 23][i]}s` });
          }).join(''))
    : '';

  /* system panel -------------------------------------------------------- */
  const lineY = 50;
  const panel = [
    text('[ ' + (solo ? 'SYSTEM' : 'LOG POSE') + ' ]', { x: OX, y: 30, 'font-size': 10, 'font-weight': 700, 'letter-spacing': 3, fill: t.primary, opacity: 0.85 }),
    animate ? text(t.copy.scan, { x: OX, y: lineY, 'font-size': 11.5, 'letter-spacing': 0.6, fill: t.textMuted, opacity: 0,
      class: 'io', style: `animation-name:inout;animation-duration:1.5s;animation-delay:.3s` }) : '',
    animate ? text(t.copy.detect(d.activeDays), { x: OX, y: lineY, 'font-size': 11.5, 'letter-spacing': 0.6, fill: t.primary, opacity: 0,
      class: 'io', style: `animation-name:inout;animation-duration:${n(T.impact - 1.2 + .4, 2)}s;animation-delay:1.2s` }) : '',
    text(t.copy.oath(d.totalContributions), { x: OX, y: lineY, 'font-size': 11.5, 'letter-spacing': 0.6, fill: t.primary,
      ...(animate ? { opacity: 0, class: 'io', style: `animation-name:inout;animation-duration:${n(T.ambient - T.oath + 0.6, 2)}s;animation-delay:${T.oath}s` } : {}) }),
    animate ? t.copy.cycle(d).map((s, i) =>
      text(s, { x: OX, y: lineY, 'font-size': 11.5, 'letter-spacing': 0.6, fill: i === 0 ? t.text : t.textMuted, opacity: 0,
        class: 'cy', style: `animation-delay:${n(T.ambient + i * 5, 2)}s` })).join('') : '',
  ].join('');

  const sigil = g({ transform: `translate(${W - 46} 40)` },
    el('polygon', { class: animate ? 'sig' : null, points: polygon(13, 6), fill: 'none', stroke: t.primary, 'stroke-width': 1.1, opacity: 0.5 }) +
    el('circle', { r: 3.4, fill: t.monarch, opacity: 0.8 }));

  /* frame --------------------------------------------------------------- */
  const br = 16, bo = 10;
  const brackets = [[bo, bo, 1, 1], [W - bo, bo, -1, 1], [bo, H - bo, 1, -1], [W - bo, H - bo, -1, -1]]
    .map(([x, y, sx, sy]) => el('path', { d: `M${x} ${y + sy * br}L${x} ${y}L${x + sx * br} ${y}`,
      fill: 'none', stroke: t.primary, 'stroke-width': 1.4, opacity: 0.55 })).join('');

  /* assemble ------------------------------------------------------------ */
  const body = [
    el('rect', { width: W, height: H, fill: t.void }),
    t.paper ? el('rect', { width: W, height: H, filter: 'url(#grain)', fill: t.void }) : '',
    el('rect', { width: W, height: H, fill: 'url(#vig)' }),
    solo ? el('rect', { width: W, height: H, fill: 'url(#scan)' }) : '',
    labels,
    burst,
    g({ ...(animate ? { class: 'q' } : {}) }, plumes.join('') + empties.join('') + soldiers.join('') + flashes.join('') + flags.join('') + eyes.join('')),
    eliteArt.join(''),
    motes,
    sweep,
    animate ? (solo ? runeRing(t) : logPose(t)) : '',
    animate ? theWord(t, rnd) : '',
    eliteLabels.join(''),
    panel,
    sigil,
    brackets,
    text(d.generatedAt.slice(0, 10), { x: W - 26, y: H - 14, 'text-anchor': 'end', 'font-size': 8, fill: t.textMuted, opacity: 0.6 }),
  ].join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(t.copy.alt(d))}">`,
    el('title', {}, esc(t.copy.alt(d))),
    defs(t),
    animate ? `<style>/*<![CDATA[*/${css(t)}/*]]>*/</style>` : '',
    body,
    '</svg>',
  ].join('\n');
}

export const BANNER_SIZE = { W, H };
