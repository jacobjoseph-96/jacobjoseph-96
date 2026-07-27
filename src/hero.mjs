/**
 * The hero card — a System status window (solo) or a WANTED poster (onepiece).
 *
 * Same rules as the banner: pure SVG, no external requests, and with CSS
 * stripped it must still render a complete, readable card.
 */

import { el, g, text, esc, n, polygon } from './svg.mjs';

const W = 1100, H = 420;

const PROFILE = {
  name: 'Jacob Joseph',
  class: 'Embedded Systems Engineer',
  title: 'Shadow of Safety-Critical',
  guild: 'Leipzig, DE',
  epithet: 'THE CODE KING',
};

const STAT_LABELS = [
  ['STR', 'str', 'commits'],
  ['AGI', 'agi', 'pull requests'],
  ['INT', 'int', 'repos + langs'],
  ['VIT', 'vit', 'longest streak'],
  ['PER', 'per', 'reviews + issues'],
];

function css(t, leveled) {
  return `
*{transform-box:fill-box}
text{font-family:${t.font};white-space:pre}
.bar{transform-origin:0% 50%;animation:fill 1.1s cubic-bezier(.2,.9,.3,1) .35s both}
@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.tw{animation:tw 2.6s steps(48) 1.1s both}
@keyframes tw{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.st{animation:pop .5s cubic-bezier(.2,1.6,.35,1) both}
@keyframes pop{0%{opacity:0;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}
.mote{animation:drift linear infinite backwards}
@keyframes drift{0%{opacity:0;transform:translateY(0)}20%{opacity:.5}100%{opacity:0;transform:translateY(-90px)}}
.sig{transform-origin:50% 50%;animation:spin 40s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
${leveled ? `.lvup{transform-origin:50% 50%;animation:lvup 2.6s ease-out 1.6s both}
@keyframes lvup{0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(1.08)}20%{transform:scale(1)}72%{opacity:1}100%{opacity:0;transform:scale(1.05)}}` : ''}
`.trim();
}

/** @param {import('./theme.mjs').Theme} t */
export function renderHero(d, t, opts = {}) {
  const animate = opts.animate !== false;
  const solo = t.skin === 'solo';
  const leveled = d.level > d.previousLevel;
  const A = (cls, style) => (animate ? { class: cls, style } : {});

  const pad = 34;
  const hpPct = Math.min(1, d.totalContributions / Math.max(1, d.level * d.level * 2.4));
  const mpPct = Math.min(1, d.longestStreak / 60);

  const bar = (y, label, pct, colour, note) => g({}, [
    text(label, { x: pad + 4, y: y + 10, 'font-size': 11, 'font-weight': 700, 'letter-spacing': 2, fill: t.textMuted }),
    el('rect', { x: pad + 34, y, width: 330, height: 12, rx: 6, fill: t.grave, stroke: t.graveEdge, 'stroke-width': 0.8 }),
    el('rect', { x: pad + 34, y, width: n(330 * pct), height: 12, rx: 6, fill: colour, ...A('bar', `animation-delay:${y === 196 ? '.35' : '.5'}s`) }),
    text(note, { x: pad + 376, y: y + 10, 'font-size': 11, fill: t.text }),
  ].join(''));

  const field = (x, y, k, v, colour) => g({}, [
    text(k, { x, y, 'font-size': 9.5, 'letter-spacing': 2.4, fill: t.textMuted }),
    text(v, { x, y: y + 19, 'font-size': 16, 'font-weight': 700, 'letter-spacing': 0.6, fill: colour ?? t.text }),
  ].join(''));

  const stats = STAT_LABELS.map(([label, key, note], i) => {
    const bx = pad + i * 202, by = 258;
    return g({ opacity: animate ? 0 : 1, ...A('st', `animation-delay:${n(1.3 + i * 0.11, 2)}s`) }, [
      el('rect', { x: bx, y: by, width: 186, height: 62, rx: 8, fill: t.grave, stroke: t.graveEdge, 'stroke-width': 1 }),
      el('rect', { x: bx, y: by, width: 3, height: 62, rx: 1.5, fill: i === 0 ? t.gold : t.monarch, opacity: 0.9 }),
      text(label, { x: bx + 16, y: by + 24, 'font-size': 11, 'font-weight': 700, 'letter-spacing': 2.6, fill: t.primary }),
      text(String(d.stats[key]), { x: bx + 170, y: by + 26, 'text-anchor': 'end', 'font-size': 21, 'font-weight': 700, fill: t.text }),
      text(note, { x: bx + 16, y: by + 46, 'font-size': 9, fill: t.textMuted }),
    ].join(''));
  }).join('');

  const motes = animate ? Array.from({ length: 12 }, (_, i) => {
    const x = 40 + ((i * 97) % (W - 80)), dur = 6 + (i % 5) * 1.4;
    return el('circle', { cx: x, cy: 300 + (i % 4) * 22, r: 1 + (i % 3) * 0.5, fill: t.monarch, opacity: 0,
      class: 'mote', style: `animation-duration:${dur}s;animation-delay:${n(-i * 0.8, 1)}s` });
  }).join('') : '';

  const br = 18, bo = 12;
  const brackets = [[bo, bo, 1, 1], [W - bo, bo, -1, 1], [bo, H - bo, 1, -1], [W - bo, H - bo, -1, -1]]
    .map(([x, y, sx, sy]) => el('path', { d: `M${x} ${y + sy * br}L${x} ${y}L${x + sx * br} ${y}`,
      fill: 'none', stroke: t.primary, 'stroke-width': 1.6, opacity: 0.6 })).join('');

  const header = solo ? '[ S T A T U S ]' : '[ W A N T E D ]';
  const oath = solo
    ? '[SYSTEM] Daily quest complete. Rewards distributed.'
    : `[MARINE] ฿${(d.totalContributions * 1e6).toLocaleString('en-US')} — dead or alive.`;

  const body = [
    el('rect', { width: W, height: H, rx: 14, fill: t.void }),
    t.paper ? el('rect', { width: W, height: H, rx: 14, fill: t.void, filter: 'url(#grain)' }) : '',
    el('rect', { x: 1, y: 1, width: W - 2, height: H - 2, rx: 13, fill: 'none', stroke: t.primary, 'stroke-width': 1.2, opacity: 0.45 }),
    solo ? el('rect', { width: W, height: H, rx: 14, fill: 'url(#scan)' }) : '',

    text(header, { x: pad, y: 46, 'font-size': 13, 'font-weight': 700, 'letter-spacing': 6, fill: t.primary }),
    text('⨯', { x: W - pad, y: 46, 'text-anchor': 'end', 'font-size': 15, fill: t.textMuted }),
    el('line', { x1: pad, y1: 62, x2: W - pad, y2: 62, stroke: t.graveEdge, 'stroke-width': 1 }),

    field(pad, 92, 'NAME', PROFILE.name),
    field(pad, 132, 'CLASS', PROFILE.class),
    field(pad + 470, 92, solo ? 'LEVEL' : 'BOUNTY', solo ? String(d.level) : `฿${(d.totalContributions * 1e6).toLocaleString('en-US')}`, t.gold),
    field(pad + 640, 92, 'RANK', d.rank, t.monarch),
    field(pad + 470, 132, 'TITLE', solo ? PROFILE.title : PROFILE.epithet),
    field(pad + 810, 132, 'GUILD', PROFILE.guild),

    bar(196, 'HP', hpPct, t.monarch, `${d.totalContributions.toLocaleString('en-US')} contributions`),
    bar(222, 'MP', mpPct, t.primary, `${d.longestStreak}-day longest streak`),

    stats,
    motes,

    g({ ...(animate ? { class: 'tw' } : {}) },
      text(oath, { x: pad, y: 356, 'font-size': 11.5, 'letter-spacing': 0.5, fill: t.primary, opacity: 0.9 })),
    text(`${d.activeDays} active days · ${d.currentStreak}-day current streak · updated ${d.generatedAt.slice(0, 10)}`,
      { x: pad, y: 380, 'font-size': 9.5, fill: t.textMuted }),

    g({ transform: `translate(${W - 70} 380)` },
      el('polygon', { ...(animate ? { class: 'sig' } : {}), points: polygon(15, 6), fill: 'none', stroke: t.primary, 'stroke-width': 1.2, opacity: 0.5 }) +
      el('circle', { r: 4, fill: t.monarch, opacity: 0.85 })),

    leveled && animate
      ? g({ class: 'lvup', opacity: 0, transform: `translate(${W - 200} 200)` },
          text('LEVEL UP!', { 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, 'letter-spacing': 3, fill: t.gold }))
      : '',

    brackets,
  ].join('');

  const alt = solo
    ? `${PROFILE.name} — Level ${d.level}, Rank ${d.rank}, ${d.totalContributions} contributions`
    : `${PROFILE.name} — WANTED, bounty ฿${(d.totalContributions * 1e6).toLocaleString('en-US')}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(alt)}">`,
    el('title', {}, esc(alt)),
    el('defs', {},
      el('pattern', { id: 'scan', width: 3, height: 3, patternUnits: 'userSpaceOnUse' },
        el('rect', { width: 3, height: 1, fill: t.text, opacity: 0.04 })) +
      (t.paper
        ? el('filter', { id: 'grain' },
            el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 3, result: 'nz' }) +
            el('feColorMatrix', { in: 'nz', type: 'saturate', values: '0' }) +
            el('feComponentTransfer', {}, el('feFuncA', { type: 'linear', slope: '0.06' })))
        : '')),
    animate ? `<style>/*<![CDATA[*/${css(t, leveled)}/*]]>*/</style>` : '',
    body,
    '</svg>',
  ].join('\n');
}

export const HERO_SIZE = { W, H };
