/**
 * Theme tokens. Nothing in the renderers hardcodes a colour or a word — it all
 * comes from here, which is what makes a new skin a token file instead of a rewrite.
 *
 * @typedef {object} Theme
 * @property {string} id
 * @property {'solo'|'onepiece'} skin  which set of set-pieces the banner draws
 * @property {'dark'|'light'} mode
 * @property {string[]} ramp           contribution levels 0..4
 * @property {object} copy
 */

const MONO = 'ui-monospace, "JetBrains Mono", "Cascadia Code", "DejaVu Sans Mono", Menlo, Consolas, monospace';

const soloCopy = {
  scan: '[SYSTEM] SCANNING BATTLEFIELD…',
  detect: (n) => `${n} FALLEN DETECTED · EXTRACTION AVAILABLE`,
  oath: (n) => `[SYSTEM] ${n} SHADOWS ANSWER THE CALL`,
  cycle: (d) => [
    `ARMY · ${d.totalContributions.toLocaleString('en-US')} SHADOWS`,
    `RANK ${d.rank} · LV.${d.level}`,
    `LONGEST CAMPAIGN · ${d.longestStreak} DAYS`,
  ],
  elites: ['IGRIS', 'BERU', 'TANK', 'IRON', 'GREED', 'KAISEL'],
  alt: (d) => `ARISE — ${d.totalContributions.toLocaleString('en-US')} GitHub contributions rising as a shadow army`,
  title: 'ARISE',
};

const opCopy = {
  scan: '[LOG POSE] CHARTING THE GRAND LINE…',
  detect: (n) => `${n} ISLANDS DETECTED · COURSE SET`,
  oath: (n) => `[LOG] ${n} DAYS AT SEA · BOUNTY ฿${(n * 1e6).toLocaleString('en-US')}`,
  cycle: (d) => [
    `฿${(d.totalContributions * 1e6).toLocaleString('en-US')}`,
    `${d.activeDays} ISLANDS CHARTED`,
    `LONGEST VOYAGE · ${d.longestStreak} DAYS`,
  ],
  elites: ['ONE PIECE', 'ZORO', 'NAMI', 'USOPP', 'SANJI', 'CHOPPER'],
  alt: (d) => `I'm gonna be the King of Code — ${d.totalContributions.toLocaleString('en-US')} GitHub contributions charting the Grand Line`,
  title: 'KING OF CODE',
  // §2B.1 — the scramble is the whole point: goal fronted, speaker second.
  ja: 'コード王におれはなる！！！',
  romaji: 'KŌDO-Ō NI ORE WA NARU!!!',
  en: "I'M GONNA BE THE KING OF CODE!!!",
};

/** @type {Record<string, Theme>} */
export const THEMES = {
  'solo-dark': {
    id: 'solo-dark', skin: 'solo', mode: 'dark', font: MONO,
    void: '#04060D', voidDeep: '#010206',
    grave: '#0E1524', graveEdge: '#18213A',
    primary: '#22D3EE', monarch: '#A855F7', monarchDim: '#6D28D9',
    arcane: '#C084FC', gold: '#FFC53D', flash: '#F5F3FF',
    text: '#E6EDF7', textMuted: '#6F7F99',
    // display type sitting on the scrim, and its knockout edge
    ink: '#F5F3FF', inkEdge: '#04060D',
    ramp: ['#0E1524', '#312E81', '#5B21B6', '#8B5CF6', '#C4B5FD'],
    copy: soloCopy,
  },
  'solo-light': {
    id: 'solo-light', skin: 'solo', mode: 'light', font: MONO,
    void: '#F2F1F7', voidDeep: '#E4E3EE',
    grave: '#DFDDE9', graveEdge: '#CFCCDD',
    primary: '#0E7490', monarch: '#6D28D9', monarchDim: '#8B5CF6',
    arcane: '#7C3AED', gold: '#B45309', flash: '#A78BFA',
    text: '#1A1726', textMuted: '#6B6880',
    ink: '#150E24', inkEdge: '#FFFFFF',
    ramp: ['#DFDDE9', '#C4B5FD', '#A78BFA', '#7C3AED', '#4C1D95'],
    copy: soloCopy,
  },
  'onepiece-dark': {
    id: 'onepiece-dark', skin: 'onepiece', mode: 'dark', font: MONO,
    void: '#07161F', voidDeep: '#030B12',
    grave: '#0E2634', graveEdge: '#17394B',
    primary: '#2A9D8F', monarch: '#E63946', monarchDim: '#8E1B26',
    arcane: '#2D1B4E', gold: '#FFB703', flash: '#FDF6E3',
    text: '#FDF6E3', textMuted: '#7FA3B3',
    ink: '#FDF6E3', inkEdge: '#04121A',
    ramp: ['#0E2634', '#14657A', '#2A9D8F', '#FFB703', '#E63946'],
    copy: opCopy,
  },
  'onepiece-light': {
    id: 'onepiece-light', skin: 'onepiece', mode: 'light', font: MONO,
    void: '#F3E4C3', voidDeep: '#E0CBA0',
    grave: '#E8D5B0', graveEdge: '#C9AE85',
    primary: '#3D2B1F', monarch: '#C1121F', monarchDim: '#8E1B26',
    arcane: '#2D1B4E', gold: '#B8860B', flash: '#E9C46A',
    text: '#2B1D10', textMuted: '#7A6248',
    ink: '#241608', inkEdge: '#FFF8E7',
    ramp: ['#E8D5B0', '#9BB8A8', '#2A9D8F', '#D98324', '#C1121F'],
    paper: true, // feTurbulence grain + rhumb lines — sells "old nautical chart"
    copy: opCopy,
  },
};

export const skinOf = (id) => THEMES[id] ?? THEMES['solo-dark'];
