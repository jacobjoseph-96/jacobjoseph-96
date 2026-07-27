/**
 * Turns a raw contribution calendar into everything the renderers need:
 * grid coordinates, quantile levels, streaks, RPG stats, elites, month labels.
 *
 * Pure and deterministic — same input always yields the same output, so
 * re-running the build with unchanged data produces a zero-diff commit.
 */

export const COLS = 53;
export const ROWS = 7;

const RANKS = [[45, 'NATIONAL'], [34, 'S'], [26, 'A'], [20, 'B'], [14, 'C'], [8, 'D'], [0, 'E']];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Deterministic PRNG. Same seed → same jitter → reproducible builds. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Level thresholds from the user's OWN distribution, not absolute counts.
 * A quiet year still gets five distinct tiers instead of a flat wash of level 1.
 */
function quantileLevels(counts) {
  const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (!nz.length) return () => 0;
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * (nz.length - 1)))];
  // Dedupe so thresholds are strictly increasing even on tiny/flat datasets.
  let t = [q(0.40), q(0.70), q(0.90)];
  t = t.map((v, i) => Math.max(v, (t[i - 1] ?? 0) + (i > 0 && v <= t[i - 1] ? 1 : 0)));
  return (c) => (c <= 0 ? 0 : c <= t[0] ? 1 : c <= t[1] ? 2 : c <= t[2] ? 3 : 4);
}

function streaks(days) {
  let cur = 0, longest = 0, run = 0;
  for (const d of days) {
    if (d.count > 0) { run++; longest = Math.max(longest, run); } else run = 0;
  }
  // Current streak walks backwards from the most recent day. An empty *today*
  // does not break it — you may simply not have committed yet.
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) cur++;
    else if (i < days.length - 1) break;
  }
  return { longest, current: cur };
}

/**
 * @param {{days:{date:string,count:number}[], commits?:number, prs?:number,
 *          issues?:number, reviews?:number, repos?:number, languages?:number,
 *          user?:string, previousLevel?:number}} raw
 */
export function derive(raw) {
  const days = raw.days.slice().sort((a, b) => a.date.localeCompare(b.date));
  const levelOf = quantileLevels(days.map((d) => d.count));

  // Column 0 begins on the Sunday on or before the first day, matching GitHub.
  const first = new Date(days[0].date + 'T00:00:00Z');
  const origin = new Date(first);
  origin.setUTCDate(origin.getUTCDate() - first.getUTCDay());

  const cells = [];
  for (const d of days) {
    const dt = new Date(d.date + 'T00:00:00Z');
    const x = Math.floor((dt - origin) / 604800000);
    if (x < 0 || x >= COLS) continue;
    cells.push({ d: d.date, c: d.count, l: levelOf(d.count), x, y: dt.getUTCDay() });
  }

  // Month labels: mark a column when its month differs from the previous label's,
  // with a 3-column gap so JAN/FEB never collide at 20px pitch.
  const months = [];
  let lastM = -1, lastX = -99;
  for (const c of cells) {
    const m = Number(c.d.slice(5, 7)) - 1;
    if (m !== lastM && c.x - lastX >= 3 && c.x <= COLS - 3) {
      months.push({ label: MONTHS[m], x: c.x });
      lastM = m; lastX = c.x;
    } else if (m !== lastM) lastM = m;
  }

  const totalContributions = days.reduce((a, b) => a + b.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const { longest, current } = streaks(days);
  const level = Math.max(1, Math.floor(Math.sqrt(totalContributions * 0.5)));
  const rank = RANKS.find(([min]) => level >= min)[1];

  return {
    generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    user: raw.user ?? 'unknown',
    totalContributions, activeDays,
    longestStreak: longest, currentStreak: current,
    level, rank, previousLevel: raw.previousLevel ?? level,
    stats: {
      str: raw.commits ?? totalContributions,
      agi: raw.prs ?? 0,
      int: (raw.repos ?? 0) + (raw.languages ?? 0),
      vit: longest,
      per: (raw.reviews ?? 0) + (raw.issues ?? 0),
    },
    cells,
    elites: pickElites(cells),
    months,
  };
}

/**
 * Top days by count, spaced out so their name labels never collide.
 * Relaxes the spacing rule rather than returning fewer than it has to.
 */
export function pickElites(cells, want = 6) {
  const pool = cells.filter((c) => c.c > 0).sort((a, b) => b.c - a.c || a.d.localeCompare(b.d));
  const out = [];
  for (const gap of [6, 3, 0]) {
    for (const c of pool) {
      if (out.length >= want) break;
      if (out.some((e) => e.d === c.d)) continue;
      if (out.every((e) => Math.abs(e.x - c.x) >= gap)) out.push(c);
    }
    if (out.length >= want) break;
  }
  return out
    .sort((a, b) => b.c - a.c || a.d.localeCompare(b.d))
    .map((c, i) => ({ ...c, rank: i }));
}

/** Synthetic year for previewing the animation at full strength (`--demo`). */
export function demoData(user = 'demo') {
  const rnd = mulberry32(20260727);
  const days = [];
  const end = new Date('2026-07-27T00:00:00Z');
  for (let i = 365; i >= 0; i--) {
    const dt = new Date(end); dt.setUTCDate(dt.getUTCDate() - i);
    const dow = dt.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const season = 0.55 + 0.45 * Math.sin((i / 365) * Math.PI * 2.2);
    const p = (weekend ? 0.35 : 0.86) * season;
    let count = rnd() < p ? Math.floor(rnd() * rnd() * 17) + 1 : 0;
    if (rnd() < 0.015) count += Math.floor(rnd() * 22); // crunch days
    days.push({ date: dt.toISOString().slice(0, 10), count });
  }
  return derive({ days, user, commits: 812, prs: 96, issues: 41, reviews: 22, repos: 18, languages: 9 });
}
