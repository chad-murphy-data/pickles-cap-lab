import {features, matchup} from './engine.js';

const median = values => {
  const ordered = [...values].sort((a, b) => a - b), n = ordered.length;
  if (!n) throw new TypeError('Replacement-profile data is missing.');
  return n % 2 ? ordered[(n - 1) / 2] : (ordered[n / 2 - 1] + ordered[n / 2]) / 2;
};

/**
 * Live strength so far, not a forecast of future draft choices or a legal
 * completed league. Open slots use fixed artificial profiles, with separate
 * median D and S values among doubles ranks61–100 in the same gender.
 * refs is accepted for the shared UI factory signature; this ranking evaluates
 * all19 other current teams, not that separate reference-opponent panel.
 */
export function createLiveRanker(players, refs) {
  void refs;
  const byId = new Map(players.map(p => [p.i, p]));
  if (byId.size !== players.length || players.some(p => !Number.isInteger(p.i) || p.i < 0)) throw new TypeError('Player IDs must be distinct nonnegative integers.');
  const syntheticStart = Math.max(...players.map(p => p.i)) + 1;
  if (!Number.isSafeInteger(syntheticStart + 120)) throw new RangeError('No safe synthetic player IDs remain.');
  const replacement = {};
  for (const g of ['M', 'F']) {
    const peers = players.filter(p => p.g === g && p.dr >= 61 && p.dr <= 100);
    replacement[g] = {d: median(peers.map(p => p.d)), s: median(peers.map(p => p.s)), profiles: peers.length};
  }
  const featureCache = new Map(), matchCache = new Map();
  function filledFeature(ids, team) {
    if (!Array.isArray(ids) || ids.length > 6 || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) throw new TypeError('Each team needs up to six distinct known players.');
    const key = `${team}:` + [...ids].sort((a, b) => a - b).join(',');
    if (featureCache.has(key)) return featureCache.get(key);
    const selected = ids.map(id => byId.get(id)), roster = [...selected];
    for (const [gi, g] of ['M', 'F'].entries()) {
      const count = selected.filter(p => p.g === g).length;
      if (count > 3) throw new TypeError('A team cannot have more than three players of one gender.');
      for (let j = count; j < 3; j++) roster.push({i: syntheticStart + team * 6 + gi * 3 + j, g, d: replacement[g].d, s: replacement[g].s});
    }
    const feature = features(roster);
    const item = {feature, key: JSON.stringify([feature.strength, feature.singles])};
    if (featureCache.size >= 512) featureCache.clear();
    featureCache.set(key, item); return item;
  }
  function probability(a, b) {
    if (a.key === b.key) return 0.5;
    const forward = a.key < b.key, left = forward ? a : b, right = forward ? b : a;
    const key = `${left.key}|${right.key}`;
    if (!matchCache.has(key)) {
      if (matchCache.size >= 10000) matchCache.clear();
      matchCache.set(key, matchup(left.feature, right.feature).win);
    }
    const p = matchCache.get(key); return forward ? p : 1 - p;
  }
  function rank(teams) {
    if (!Array.isArray(teams) || teams.length !== 20) throw new TypeError('Live ranks require20 teams.');
    const filled = teams.map((ids, team) => filledFeature(ids, team)), wins = Array(20).fill(0);
    for (let a = 0; a < 20; a++) for (let b = a + 1; b < 20; b++) {
      const p = probability(filled[a], filled[b]); wins[a] += p; wins[b] += 1 - p;
    }
    return teams.map((ids, team) => ({team, rank: 1 + wins.filter(w => w > wins[team] + 1e-12).length, win: wins[team] / 19, picks: ids.length}));
  }
  rank.method = {
    label: 'Live power rank', opponentPanel: 'The other19 currently filled teams',
    replacementProfiles: structuredClone(replacement),
    explanation: 'Open slots use artificial same-gender profiles with median doubles and singles ratings from doubles ranks61–100. These two medians need not describe one real athlete. No future choices, prices, availability or budget legality are forecast. Once every team is full, the same calculation is the actual modeled round robin.',
  };
  return rank;
}
