#!/usr/bin/env node
/**
 * Fetch the contribution calendar and account stats → data/contributions.json.
 *
 * Two paths:
 *   GH_TOKEN set  → GraphQL. Full fidelity, and picks up PRIVATE contributions
 *                   if the account has "Include private contributions on my
 *                   profile" enabled.
 *   no token      → public scrape via github-contributions-api.jogruber.de plus
 *                   the unauthenticated REST API. Lets you iterate locally with
 *                   no secrets, at the cost of private contributions.
 *
 * Committing the result means every render is reproducible and needs no token.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive } from '../src/derive.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'contributions.json');
const USER = process.env.GH_USER || 'jacobjoseph-96';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

const QUERY = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false){
      totalCount nodes{ primaryLanguage{ name } }
    }
  }
}`;

async function viaGraphQL() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': USER },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`graphql: ${json.errors.map((e) => e.message).join('; ')}`);

  const u = json.data.user;
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
  const languages = new Set(u.repositories.nodes.map((r) => r.primaryLanguage?.name).filter(Boolean));

  return {
    days, user: USER,
    commits: cc.totalCommitContributions,
    prs: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
    reviews: cc.totalPullRequestReviewContributions,
    repos: u.repositories.totalCount,
    languages: languages.size,
  };
}

async function viaPublic() {
  const j = async (url) => {
    const r = await fetch(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': USER } });
    if (!r.ok) throw new Error(`${url} → ${r.status}`);
    return r.json();
  };

  const cal = await j(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
  const days = cal.contributions.map((d) => ({ date: d.date, count: d.count }));

  let repos = [], prs = 0, issues = 0;
  try { repos = await j(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`); } catch {}
  try { prs = (await j(`https://api.github.com/search/issues?q=author:${USER}+type:pr&per_page=1`)).total_count ?? 0; } catch {}
  try { issues = (await j(`https://api.github.com/search/issues?q=author:${USER}+type:issue&per_page=1`)).total_count ?? 0; } catch {}

  const owned = repos.filter((r) => !r.fork);
  const languages = new Set(owned.map((r) => r.language).filter(Boolean));

  return {
    days, user: USER,
    commits: days.reduce((a, b) => a + b.count, 0),
    prs, issues, reviews: 0,
    repos: owned.length, languages: languages.size,
  };
}

const previousLevel = (() => {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')).level; } catch { return undefined; }
})();

const total = (r) => r.days.reduce((a, b) => a + b.count, 0);

let graph = null;
if (TOKEN) {
  try { graph = await viaGraphQL(); }
  catch (e) { console.warn(`! graphql failed (${e.message.slice(0, 120)}) — falling back to public`); }
}

/**
 * Always fetch the public calendar too, even when GraphQL succeeded.
 *
 * `contributionsCollection` is scoped to what the *token* can see. A
 * repo-scoped GITHUB_TOKEN returns a small fraction of the real year and
 * reports it as success — no error, no clue, just a near-empty chart. That
 * silent truncation shipped an 11-contribution year against a real 75.
 * Cross-checking costs one unauthenticated request and turns the failure
 * from invisible into a loud warning.
 */
let pub = null;
try { pub = await viaPublic(); }
catch (e) { console.warn(`! public calendar unavailable (${e.message.slice(0, 120)})`); }

if (!graph && !pub) throw new Error('no contribution data from either source');

let raw, source;
if (graph && pub && total(pub) > total(graph)) {
  raw = pub;
  source = 'public';
  console.warn(`! calendars disagree — graphql ${total(graph)}, public ${total(pub)}. Using public.`);
  console.warn(`  The token can only see part of your year. Set GH_PAT (classic, scope`);
  console.warn(`  read:user) in this repo's secrets to read the full profile calendar,`);
  console.warn(`  including private contributions if your profile has them enabled.`);
} else {
  raw = graph ?? pub;
  source = graph ? 'graphql' : 'public';
}

// Each source under-reports different fields, so every value is a lower
// bound — take the better of the two rather than whichever calendar won.
const best = (a, b) => Math.max(a ?? 0, b ?? 0);
raw = {
  ...raw,
  prs: best(graph?.prs, pub?.prs),
  issues: best(graph?.issues, pub?.issues),
  reviews: best(graph?.reviews, pub?.reviews),
  repos: best(graph?.repos, pub?.repos),
  languages: best(graph?.languages, pub?.languages),
};

const data = derive({ ...raw, previousLevel });
data.source = source;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');

console.log(`✓ ${source}: ${data.totalContributions} contributions over ${data.activeDays} active days`);
console.log(`  level ${data.level} · rank ${data.rank} · longest streak ${data.longestStreak}d · ${data.elites.length} elites`);
if (data.activeDays < 40) {
  console.warn(`\n! Only ${data.activeDays} active days — the army will look thin.`);
  console.warn(`  If most of your work is private: GitHub → Settings → Public profile →`);
  console.warn(`  "Include private contributions on my profile", then re-run with a PAT`);
  console.warn(`  (GH_TOKEN, scope read:user). Preview the design meanwhile: npm run demo`);
}
