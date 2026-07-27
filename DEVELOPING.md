# DEVELOPING

Everything on the profile is generated from my own contribution data by the code in
this repo. Pure SVG, **zero runtime dependencies**, no third-party card services.

```bash
npm run fetch     # → data/contributions.json  (works with no token)
npm run render    # → dist/*.svg
npm run demo      # → dist/*.svg from a synthetic full year (design preview)
npm run preview   # → http://localhost:8777  scrubber + frame grid
npm run build     # fetch + render
```

No `npm install` needed. Node ≥ 20.

---

## The one hard constraint

A GitHub README can never be interactive. The sanitizer strips `<script>`, `<iframe>`
and event handlers, and images are proxied through **camo**, which serves them inert.
So everything here is a *pure SVG with CSS `@keyframes` inside the file* — the same
technique `snk` uses, which is why it survives the proxy.

Three consequences that drive the whole design:

1. **`prefers-reduced-motion` cannot be honoured.** An SVG loaded via `<img>` is
   sandboxed from the page and never sees the media query. The only correct answer is
   the explicit `<details>` static-version link in the README, pointing at
   `arise-static.svg`.
2. **`prefers-color-scheme` inside the SVG is unreliable** for the same reason. Hence
   two files plus `<picture>` + `<source media>`, which the *parent* document evaluates.
3. **Camo caches aggressively.** `scripts/stamp-readme.mjs` rewrites `?v=` on every run
   so the profile does not serve yesterday's frame.

## The robustness property

> With CSS stripped, the base attributes must render the **finished army**.

Animations only ever take things away and put them back — `animation-fill-mode: both`
means the `0%` keyframe applies during the delay, so cells start invisible *with* CSS
and are fully visible *without* it. Intro-only elements (rune ring, the word, cracks,
shockwave) carry a base `opacity="0"` so they never appear in the fallback.

Verify it after any change:

```bash
npm run demo
node -e "const fs=require('fs');fs.writeFileSync('dist/t.svg',fs.readFileSync('dist/arise-dark.svg','utf8').replace(/<style>[\s\S]*?<\/style>/,''))"
# open dist/t.svg — you should see a complete, clean contribution heatmap
```

## Layout

```
src/theme.mjs    4 themes (solo/onepiece × dark/light). No colour or word is
                 hardcoded anywhere else — that is what makes a skin a token file.
src/derive.mjs   calendar → grid coords, quantile levels, streaks, stats, elites.
                 Deterministic: same input, same output, zero-diff rebuilds.
src/svg.mjs      string helpers. No DOM, no template engine.
src/banner.mjs   the animation. One renderer, two skins.
src/hero.mjs     the status window / WANTED poster.
src/glyphs-ja.json   the Japanese line as <path> outlines (see below).
preview/         scrubber (index.html) + frame grid (grid.html)
```

### Timing (banner)

| t (s) | |
|---|---|
| 0.00–0.90 | the void — grave markers only |
| 0.90–2.30 | rune ring / Log Pose draws in |
| 2.30–3.15 | the inhale — board trembles, core contracts |
| **3.15** | **the word** + shockwave |
| 3.15–5.30 | cells rise in the wave's wake |
| 5.40–7.00 | elites, individually, with pillars and name labels |
| 7.00–8.20 | the oath line |
| 8.20 → ∞ | ambient (shimmer, embers, eye glints, status cycle) |

The intro plays **once and freezes**; only the ambient layer loops. A reveal that loops
gets boring, and camo re-serves the image on every page load, so each visitor gets the
show exactly once.

### The wave

A pure Euclidean radius would be wrong: the grid is 53 wide and 7 tall, so a circular
front leaves the top and bottom edges immediately and spends the rest of its life as two
vertical lines. `|dx| + 0.28·|dy|` gives a gently convex front sweeping both ways. The
±0.06s seeded jitter matters more than it sounds — without it the wave reads as a
progress bar rather than ground breaking.

### Transforms

Every animated element uses `transform-box: fill-box` with an explicit
`transform-origin`. Cells use `50% 100%` so they scale **up from their bottom edge** —
a soldier standing out of the ground, or land surfacing from the sea. Anything that
scales while stroked (shockwave, elite rings) needs `vector-effect="non-scaling-stroke"`
or the stroke fattens with it.

## The Japanese line

`src/glyphs-ja.json` holds `コード王におれはなる！！！` as pre-baked `<path>` data.

This is not optional. Camo-served SVG can only use fonts on the **viewer's** machine, so
live `<text>` would render as tofu (`□□□□□□□□□□`) for anyone without a CJK font —
permanently, on the profile. Regenerate only if the wording changes:

```bash
npm i -D opentype.js
npm run glyphs                        # default line
npm run glyphs -- 'プログラム王におれはなる！！！'
```

Noto Sans JP is SIL OFL, which permits modification and embedding. Only the *outlines*
of the glyphs used are committed; the font binary is fetched to a temp file and never
redistributed. Per the OFL reserved-name clause, don't call the output "Noto".

The scramble is the point: `コード王に` **`おれはなる`**, goal fronted, speaker second —
the same inversion Oda used in `海賊王におれはなる`. Never `おれはコード王になる`.

## ⚠ Sparse contribution data

The public calendar currently shows **10 contributions over 5 days**, so the army is
5 soldiers in an empty field. The renderer handles it correctly (quantile levels still
spread across tiers, elites degrade to however many exist) but the effect needs density.

If most of your work is private:

1. GitHub → Settings → Public profile → **Include private contributions on my profile**
2. Create a classic PAT with scope `read:user`, add it as the repo secret `GH_PAT`

The workflow already prefers `GH_PAT` over the built-in token. Check your commit email is
verified under Settings → Emails too — commits authored with an unlinked address never
appear on the calendar.

Meanwhile, `npm run demo` renders a synthetic full year so you can judge the design.

## Switching the profile to One Piece

Swap the filenames in `README.md`: `hero-solo-*` → `hero-onepiece-*`, `arise-*` →
`grandline-*`. Both skins are built on every run, so nothing else changes.

Note the light variants pull in opposite directions: Solo Leveling genuinely wants to be
dark, and One Piece is better on parchment than on navy.
